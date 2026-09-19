import { prisma } from "../../database/prisma";
import { dateKeyUTC, toUtcDateOnly } from "../../utils/date";
import { getDisplayStreak, hasCompletedToday, recordCompletion } from "./streak.logic";

function toStreakState(row: { currentStreak: number; bestStreak: number; lastCompletedDate: Date | null }) {
  return {
    currentStreak: row.currentStreak,
    bestStreak: row.bestStreak,
    lastCompletedDateKey: row.lastCompletedDate ? dateKeyUTC(row.lastCompletedDate) : null,
  };
}

export async function getStreakSummary(userId: string, now: Date = new Date()) {
  const row = await prisma.userStreak.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  const state = toStreakState(row);
  return {
    currentStreak: getDisplayStreak(state, now),
    bestStreak: row.bestStreak,
    hasCompletedToday: hasCompletedToday(state, now),
  };
}

/** Called exactly once per completed daily GameSession. Practice sessions never call this. */
export async function recordDailyCompletion(userId: string, now: Date = new Date()) {
  const row = await prisma.userStreak.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const next = recordCompletion(toStreakState(row), now);

  return prisma.userStreak.update({
    where: { userId },
    data: {
      currentStreak: next.currentStreak,
      bestStreak: next.bestStreak,
      lastCompletedDate: next.lastCompletedDateKey ? toUtcDateOnly(now) : null,
    },
  });
}
