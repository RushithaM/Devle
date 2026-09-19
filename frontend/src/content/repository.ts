import { TOPIC_IDS, type Challenge, type TopicId } from "./types";

function fixture(partial: Omit<Challenge, "type" | "hints" | "relatedConcepts" | "tags"> & Partial<Challenge>): Challenge {
  return {
    type: "WORD",
    hints: ["Conceptual clue.", "More direct clue."],
    relatedConcepts: [],
    tags: ["fixture"],
    ...partial,
  };
}

/**
 * Compact local catalog used by the leftover client-side daily picker tests.
 * Live play reads challenges from the backend — this file exists so those
 * existing tests keep covering the deterministic picker.
 */
const FIXTURES: Challenge[] = TOPIC_IDS.flatMap((topic) =>
  Array.from({ length: 8 }, (_, i) =>
    fixture({
      id: `${topic}-fixture-${i + 1}`,
      topic,
      question: `${topic} fixture question ${i + 1}`,
      answer: "STACK",
      difficulty: i < 3 ? "easy" : i < 6 ? "medium" : "hard",
      explanation: "Fixture explanation.",
    }),
  ),
);

export const challengeRepository = {
  getByTopic(topic: TopicId): Challenge[] {
    return FIXTURES.filter((challenge) => challenge.topic === topic);
  },
  getAll(): Challenge[] {
    return FIXTURES;
  },
};
