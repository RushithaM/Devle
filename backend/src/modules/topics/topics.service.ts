import { prisma } from "../../database/prisma";
import { AppError } from "../../utils/AppError";

export function listTopics() {
  return prisma.topic.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getTopicOrThrow(id: string) {
  const topic = await prisma.topic.findUnique({ where: { id } });
  if (!topic) {
    throw AppError.badRequest(`Unknown topic "${id}"`);
  }
  return topic;
}
