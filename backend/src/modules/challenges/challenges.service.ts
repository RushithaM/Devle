import { pickDeterministicIndex } from "@devle/engine";
import type { Difficulty } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { AppError } from "../../utils/AppError";
import { dateKeyUTC, dayNumberUTC, toUtcDateOnly } from "../../utils/date";

/**
 * The single topic featured as "today's Devle", rotating deterministically
 * through the full topic catalog by day number — same idea as the original
 * client-only MVP, just computed here instead of trusted from the client.
 */
export async function getFeaturedTopic(date: Date = new Date()) {
  const topics = await prisma.topic.findMany({ orderBy: { sortOrder: "asc" } });
  if (topics.length === 0) {
    throw AppError.notFound("No topics configured");
  }
  const index = (dayNumberUTC(date) - 1) % topics.length;
  return topics[index]!;
}

/**
 * Finds (or, on first request for that day, creates) the one Challenge that
 * (date, topic, difficulty) maps to. Every user asking for the same triple
 * gets the same DailyChallenge row — that's what makes the daily identical
 * for everyone, and it's resolved here, never trusted from the client.
 */
export async function resolveDailyChallenge(
  date: Date,
  topicId: string,
  difficulty: Difficulty,
) {
  const dateOnly = toUtcDateOnly(date);

  const existing = await prisma.dailyChallenge.findUnique({
    where: { date_topicId_difficulty: { date: dateOnly, topicId, difficulty } },
    include: { challenge: true, topic: true },
  });
  if (existing) return existing;

  const pool = await prisma.challenge.findMany({
    where: { topicId, difficulty, isActive: true },
    orderBy: { id: "asc" },
  });
  if (pool.length === 0) {
    throw AppError.notFound(`No ${difficulty} challenges available for topic "${topicId}"`);
  }

  const seed = `${topicId}:${difficulty}:${dateKeyUTC(dateOnly)}`;
  const challenge = pool[pickDeterministicIndex(seed, pool.length)]!;

  try {
    return await prisma.dailyChallenge.create({
      data: { date: dateOnly, topicId, difficulty, challengeId: challenge.id },
      include: { challenge: true, topic: true },
    });
  } catch {
    // Lost a race with a concurrent request creating the same row — fetch what won.
    const winner = await prisma.dailyChallenge.findUnique({
      where: { date_topicId_difficulty: { date: dateOnly, topicId, difficulty } },
      include: { challenge: true, topic: true },
    });
    if (!winner) throw AppError.notFound("Failed to resolve daily challenge");
    return winner;
  }
}

/** Topics this user has already finished today at the given difficulty. */
export async function listCompletedTopicIds(
  userId: string,
  difficulty: Difficulty,
  date: Date = new Date(),
) {
  const sessions = await prisma.gameSession.findMany({
    where: {
      userId,
      status: { in: ["WON", "LOST"] },
      dailyChallenge: {
        date: toUtcDateOnly(date),
        difficulty,
      },
    },
    select: { dailyChallenge: { select: { topicId: true } } },
  });

  return [...new Set(sessions.flatMap((session) => (session.dailyChallenge ? [session.dailyChallenge.topicId] : [])))];
}

export async function pickPracticeChallenge(topicId: string, difficulty: Difficulty) {
  const pool = await prisma.challenge.findMany({
    where: { topicId, difficulty, isActive: true },
  });
  if (pool.length === 0) {
    throw AppError.notFound(`No ${difficulty} challenges available for topic "${topicId}"`);
  }
  return pool[Math.floor(Math.random() * pool.length)]!;
}
