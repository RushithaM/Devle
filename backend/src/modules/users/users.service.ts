import type { Difficulty, User } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { AppError } from "../../utils/AppError";
import { parseDateKeyUTC } from "../../utils/date";
import type { MigrateLocalInput } from "./users.schemas";
import type { PublicUser } from "./users.types";

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

/** Creates a user plus the one-row-each preference/streak/statistics records every user needs. */
export async function createUserWithDefaults(data: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: {
      ...data,
      preference: { create: { difficulty: "MEDIUM" } },
      streak: { create: {} },
      statistics: { create: {} },
    },
  });
}

export async function getPreference(userId: string) {
  const preference = await prisma.userPreference.findUnique({ where: { userId } });
  if (!preference) {
    throw AppError.notFound("Preference not found for user");
  }
  return preference;
}

export async function updatePreference(
  userId: string,
  updates: { difficulty?: Difficulty; topicId?: string | null },
) {
  if (updates.topicId) {
    const topic = await prisma.topic.findUnique({ where: { id: updates.topicId } });
    if (!topic) {
      throw AppError.badRequest(`Unknown topic "${updates.topicId}"`);
    }
  }

  return prisma.userPreference.update({
    where: { userId },
    data: updates,
  });
}

/**
 * One-time, best-effort import of a browser's pre-login localStorage progress.
 * Only applies when the backend record is still pristine, so a second login
 * (or a second browser) can never clobber real server-side progress.
 */
export async function importLocalProgress(userId: string, payload: MigrateLocalInput) {
  const [streakRow, statsRow] = await Promise.all([
    prisma.userStreak.upsert({ where: { userId }, update: {}, create: { userId } }),
    prisma.userStatistics.upsert({ where: { userId }, update: {}, create: { userId } }),
  ]);

  let migratedStreak = false;
  let migratedStatistics = false;

  if (payload.streak && streakRow.currentStreak === 0 && streakRow.bestStreak === 0 && !streakRow.lastCompletedDate) {
    await prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: payload.streak.current,
        bestStreak: payload.streak.best,
        lastCompletedDate: payload.streak.lastCompletedDateKey
          ? parseDateKeyUTC(payload.streak.lastCompletedDateKey)
          : null,
      },
    });
    migratedStreak = true;
  }

  if (payload.statistics && statsRow.gamesPlayed === 0) {
    await prisma.userStatistics.update({
      where: { userId },
      data: {
        gamesPlayed: payload.statistics.gamesPlayed,
        gamesWon: payload.statistics.gamesWon,
        totalAttemptsOnWins: payload.statistics.totalAttemptsOnWins,
      },
    });
    migratedStatistics = true;
  }

  return { migratedStreak, migratedStatistics };
}
