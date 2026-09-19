import { prisma } from "../database/prisma";

export async function resetDatabase() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "Guess", "GameSession", "DailyChallenge", "UserTopicStatistic", "UserStatistics", "UserStreak", "UserPreference", "Challenge", "Topic", "User" RESTART IDENTITY CASCADE`,
  );
}

export async function seedTopic(id = "dsa", overrides: Partial<{ name: string; shortName: string; description: string; sortOrder: number }> = {}) {
  return prisma.topic.upsert({
    where: { id },
    update: {},
    create: {
      id,
      name: overrides.name ?? "Data Structures & Algorithms",
      shortName: overrides.shortName ?? "DSA",
      description: overrides.description ?? "Core structures and algorithmic thinking",
      sortOrder: overrides.sortOrder ?? 0,
    },
  });
}

let counter = 0;
const FIXTURE_ANSWERS = [
  "STACK",
  "QUEUE",
  "ARRAY",
  "TABLE",
  "MOUSE",
  "CLOUD",
  "BRAVE",
  "STONE",
  "LEMON",
  "TIGER",
];

export async function seedChallenge(
  topicId: string,
  difficulty: "EASY" | "MEDIUM" | "HARD",
  overrides: Partial<{ answer: string; question: string }> = {},
) {
  const answer = overrides.answer ?? FIXTURE_ANSWERS[counter % FIXTURE_ANSWERS.length]!;
  counter += 1;
  return prisma.challenge.create({
    data: {
      topicId,
      question: overrides.question ?? `Test question #${counter}`,
      answer,
      difficulty,
      hint1: "Test hint one",
      hint2: "Test hint two",
      explanation: "Test explanation",
      relatedConcepts: ["Concept A", "Concept B"],
      interviewTip: "Test tip",
      tags: ["test", "fixture"],
      isActive: true,
    },
  });
}
