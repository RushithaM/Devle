import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { TOPIC_CATALOG } from "./content/topics";

const prisma = new PrismaClient();
const localDir = join(dirname(fileURLToPath(import.meta.url)), "content", "local");

const challengeSchema = z.object({
  id: z.string().min(1),
  topicId: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  hint1: z.string().min(1),
  hint2: z.string().min(1),
  explanation: z.string().min(1),
  relatedConcepts: z.array(z.string()),
  interviewTip: z.string().nullable().optional(),
  tags: z.array(z.string()),
  isActive: z.boolean().optional(),
});

async function loadLocalChallenges() {
  try {
    const files = (await readdir(localDir)).filter((name) => name.endsWith(".json")).sort();
    const challenges = [];
    for (const file of files) {
      const raw = JSON.parse(await readFile(join(localDir, file), "utf8"));
      challenges.push(...z.array(challengeSchema).parse(raw));
    }
    return challenges;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function main() {
  console.log(`Seeding ${TOPIC_CATALOG.length} topics...`);
  for (const [index, topic] of TOPIC_CATALOG.entries()) {
    await prisma.topic.upsert({
      where: { id: topic.id },
      update: {
        name: topic.name,
        shortName: topic.shortName,
        description: topic.description,
        sortOrder: index,
      },
      create: {
        id: topic.id,
        name: topic.name,
        shortName: topic.shortName,
        description: topic.description,
        sortOrder: index,
      },
    });
  }

  const localChallenges = await loadLocalChallenges();
  if (localChallenges.length === 0) {
    const existing = await prisma.challenge.count();
    console.log(
      existing > 0
        ? `No local content dump found. Leaving ${existing} database challenges unchanged.`
        : "No local content dump found. Challenges live in the database, not in git.",
    );
    return;
  }

  console.log(`Importing ${localChallenges.length} challenges from content/local (gitignored)...`);
  let created = 0;
  let updated = 0;
  for (const challenge of localChallenges) {
    const data = {
      topicId: challenge.topicId,
      question: challenge.question,
      answer: challenge.answer.toUpperCase(),
      difficulty: challenge.difficulty,
      hint1: challenge.hint1,
      hint2: challenge.hint2,
      explanation: challenge.explanation,
      relatedConcepts: challenge.relatedConcepts,
      interviewTip: challenge.interviewTip ?? null,
      tags: challenge.tags,
      isActive: challenge.isActive ?? true,
    };
    const existing = await prisma.challenge.findUnique({ where: { id: challenge.id } });
    await prisma.challenge.upsert({
      where: { id: challenge.id },
      update: data,
      create: { id: challenge.id, ...data },
    });
    if (existing) updated += 1;
    else created += 1;
  }
  console.log(`Done. ${created} created, ${updated} updated.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
