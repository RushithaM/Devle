import {
  DEFAULT_MAX_ATTEMPTS,
  evaluateGuess,
  getGameStatus,
  isValidWord,
  type GuessResult,
} from "@devle/engine";
import type { Difficulty } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { AppError } from "../../utils/AppError";
import { getFeaturedTopic, pickPracticeChallenge, resolveDailyChallenge } from "../challenges/challenges.service";
import { recordDailyCompletion } from "../streaks/streak.service";
import { recordGameResult } from "../statistics/statistics.service";
import { getTopicOrThrow } from "../topics/topics.service";
import { getPreference } from "../users/users.service";
import { sessionInclude, type GameSessionWithDetails } from "./games.dto";

export async function getGameOrThrow(userId: string, gameId: string): Promise<GameSessionWithDetails> {
  const session = await prisma.gameSession.findUnique({
    where: { id: gameId },
    include: sessionInclude,
  });
  // 404 (not 403) for someone else's session — don't confirm it even exists.
  if (!session || session.userId !== userId) {
    throw AppError.notFound("Game not found");
  }
  return session;
}

/**
 * Finds or starts today's daily game for this user. Resuming an
 * already-completed session is how "play once per day" + "view your result
 * again later" both fall out of the same code path.
 */
export async function createOrResumeDailyGame(
  userId: string,
  difficultyOverride?: Difficulty,
  topicId?: string,
): Promise<GameSessionWithDetails> {
  const now = new Date();
  const difficulty = difficultyOverride ?? (await getPreference(userId)).difficulty;
  const featured = await getFeaturedTopic(now);
  const topic = topicId ? await getTopicOrThrow(topicId) : featured;
  const dailyChallenge = await resolveDailyChallenge(now, topic.id, difficulty);
  // Featured "Today's Devle" is the streak check-in. Other topics reuse the
  // same per-day question, but they don't increment the streak.
  const mode = topic.id === featured.id ? "DAILY" : "PRACTICE";

  const existing = await prisma.gameSession.findUnique({
    where: { userId_dailyChallengeId: { userId, dailyChallengeId: dailyChallenge.id } },
    include: sessionInclude,
  });
  if (existing) {
    return existing;
  }

  try {
    return await prisma.gameSession.create({
      data: {
        userId,
        challengeId: dailyChallenge.challengeId,
        dailyChallengeId: dailyChallenge.id,
        mode,
        maxAttempts: DEFAULT_MAX_ATTEMPTS,
      },
      include: sessionInclude,
    });
  } catch {
    const winner = await prisma.gameSession.findUnique({
      where: { userId_dailyChallengeId: { userId, dailyChallengeId: dailyChallenge.id } },
      include: sessionInclude,
    });
    if (!winner) throw AppError.notFound("Failed to start daily game");
    return winner;
  }
}

export async function createPracticeGame(
  userId: string,
  topicId: string,
  difficulty: Difficulty,
): Promise<GameSessionWithDetails> {
  await getTopicOrThrow(topicId);
  const challenge = await pickPracticeChallenge(topicId, difficulty);

  return prisma.gameSession.create({
    data: {
      userId,
      challengeId: challenge.id,
      mode: "PRACTICE",
      maxAttempts: DEFAULT_MAX_ATTEMPTS,
    },
    include: sessionInclude,
  });
}

export async function findExistingDailySession(userId: string, dailyChallengeId: string) {
  return prisma.gameSession.findUnique({
    where: { userId_dailyChallengeId: { userId, dailyChallengeId } },
    include: sessionInclude,
  });
}

export async function submitGuess(userId: string, gameId: string, rawGuess: string) {
  const session = await getGameOrThrow(userId, gameId);

  if (session.status !== "PLAYING") {
    throw AppError.badRequest("This game is already finished", "GAME_OVER");
  }

  const answer = session.challenge.answer;
  if (!isValidWord(rawGuess, answer.length)) {
    throw AppError.badRequest(
      `Guess must be ${answer.length} letters, A-Z only`,
      "INVALID_GUESS",
    );
  }

  const guess = rawGuess.trim().toUpperCase();
  const result: GuessResult = evaluateGuess(answer, guess);
  const attemptNumber = session.attempts + 1;

  const priorGuesses = session.guesses.map((g) => g.guess);
  const priorResults = session.guesses.map((g) => g.result as unknown as GuessResult);
  const engineStatus = getGameStatus({
    guesses: [...priorGuesses, guess],
    results: [...priorResults, result],
    maxAttempts: session.maxAttempts,
  });
  // The engine speaks lowercase ("playing"/"won"/"lost"); Prisma's enum is uppercase.
  const status = engineStatus.toUpperCase() as "PLAYING" | "WON" | "LOST";

  const [, updated] = await prisma.$transaction([
    prisma.guess.create({
      data: { gameSessionId: session.id, guess, result: result as object, attemptNumber },
    }),
    prisma.gameSession.update({
      where: { id: session.id },
      data: {
        attempts: attemptNumber,
        status,
        completedAt: status === "PLAYING" ? null : new Date(),
      },
      include: sessionInclude,
    }),
  ]);

  if (status !== "PLAYING") {
    const won = status === "WON";
    if (session.mode === "DAILY") {
      await recordDailyCompletion(userId);
    }
    await recordGameResult(userId, session.challenge.topicId, session.challenge.difficulty, {
      won,
      attempts: attemptNumber,
      hintsUsed: session.hintsUsed,
    });
  }

  return updated;
}

export async function useHint(userId: string, gameId: string) {
  const session = await getGameOrThrow(userId, gameId);

  if (session.status !== "PLAYING") {
    throw AppError.badRequest("This game is already finished", "GAME_OVER");
  }
  if (session.hintsUsed >= 2) {
    throw AppError.badRequest("No hints remaining", "NO_HINTS_LEFT");
  }

  const hintNumber = session.hintsUsed + 1;
  const text = hintNumber === 1 ? session.challenge.hint1 : session.challenge.hint2;

  await prisma.gameSession.update({
    where: { id: session.id },
    data: { hintsUsed: hintNumber },
  });

  return { hintNumber, text, hintsUsed: hintNumber };
}
