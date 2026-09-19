import type { Prisma } from "@prisma/client";
import { dayNumberUTC } from "../../utils/date";

const sessionInclude = {
  challenge: { include: { topic: true } },
  guesses: { orderBy: { attemptNumber: "asc" as const } },
  dailyChallenge: true,
} satisfies Prisma.GameSessionInclude;

export type GameSessionWithDetails = Prisma.GameSessionGetPayload<{ include: typeof sessionInclude }>;

export { sessionInclude };

export function toGameSessionDTO(session: GameSessionWithDetails) {
  const finished = session.status !== "PLAYING";
  const dayNumber = session.dailyChallenge ? dayNumberUTC(session.dailyChallenge.date) : undefined;

  const revealedHints: string[] = [];
  if (session.hintsUsed >= 1) revealedHints.push(session.challenge.hint1);
  if (session.hintsUsed >= 2) revealedHints.push(session.challenge.hint2);

  return {
    id: session.id,
    mode: session.mode,
    status: session.status,
    attempts: session.attempts,
    maxAttempts: session.maxAttempts,
    hintsUsed: session.hintsUsed,
    answerLength: session.challenge.answer.length,
    topic: {
      id: session.challenge.topic.id,
      name: session.challenge.topic.name,
      shortName: session.challenge.topic.shortName,
    },
    difficulty: session.challenge.difficulty,
    question: session.challenge.question,
    dayNumber,
    revealedHints,
    guesses: session.guesses.map((g) => ({
      guess: g.guess,
      result: g.result,
      attemptNumber: g.attemptNumber,
    })),
    ...(finished
      ? {
          answer: session.challenge.answer,
          explanation: session.challenge.explanation,
          relatedConcepts: session.challenge.relatedConcepts,
          interviewTip: session.challenge.interviewTip,
        }
      : {}),
  };
}
