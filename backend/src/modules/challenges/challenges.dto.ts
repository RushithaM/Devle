import type { Challenge } from "@prisma/client";

/** Never send the answer, hints, or explanation up front — those are earned during play. */
export function toPublicChallenge(
  challenge: Pick<Challenge, "id" | "topicId" | "question" | "difficulty" | "answer">,
) {
  return {
    id: challenge.id,
    topicId: challenge.topicId,
    question: challenge.question,
    difficulty: challenge.difficulty,
    answerLength: challenge.answer.length,
  };
}
