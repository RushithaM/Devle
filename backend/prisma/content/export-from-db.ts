import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

/**
 * Writes a gitignored local dump of Challenge rows.
 * Use this for machine-to-machine backup — never commit the output.
 */
const prisma = new PrismaClient();
const outDir = join(dirname(fileURLToPath(import.meta.url)), "local");

async function main() {
  await mkdir(outDir, { recursive: true });
  const challenges = await prisma.challenge.findMany({
    orderBy: [{ topicId: "asc" }, { id: "asc" }],
  });

  const byTopic = new Map<string, typeof challenges>();
  for (const challenge of challenges) {
    const list = byTopic.get(challenge.topicId) ?? [];
    list.push(challenge);
    byTopic.set(challenge.topicId, list);
  }

  for (const [topicId, rows] of byTopic) {
    const payload = rows.map((row) => ({
      id: row.id,
      topicId: row.topicId,
      question: row.question,
      answer: row.answer,
      difficulty: row.difficulty,
      hint1: row.hint1,
      hint2: row.hint2,
      explanation: row.explanation,
      relatedConcepts: row.relatedConcepts,
      interviewTip: row.interviewTip,
      tags: row.tags,
      isActive: row.isActive,
    }));
    await writeFile(join(outDir, `${topicId}.json`), `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`Exported ${payload.length} ${topicId} challenges`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
