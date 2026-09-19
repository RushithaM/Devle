import type { Difficulty } from "@prisma/client";
import { prisma } from "../../database/prisma";
import { applyResult, averageAttempts, winRate, type GameResult } from "./statistics.logic";

export async function getStatisticsSummary(userId: string) {
  const totals = await prisma.userStatistics.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  return {
    gamesPlayed: totals.gamesPlayed,
    gamesWon: totals.gamesWon,
    winRate: winRate(totals),
    averageAttempts: averageAttempts(totals),
  };
}

/**
 * Updates both the app-wide totals and the per-topic/difficulty breakdown.
 * The breakdown isn't surfaced in the UI yet — it's what a future adaptive
 * difficulty feature would read ("mastered Easy DSA, ready for Medium?").
 */
export async function recordGameResult(
  userId: string,
  topicId: string,
  difficulty: Difficulty,
  result: GameResult,
) {
  const current = await prisma.userStatistics.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  const next = applyResult(current, result);

  await prisma.userStatistics.update({
    where: { userId },
    data: {
      gamesPlayed: next.gamesPlayed,
      gamesWon: next.gamesWon,
      totalAttemptsOnWins: next.totalAttemptsOnWins,
      totalHintsUsed: next.totalHintsUsed,
    },
  });

  const breakdown = await prisma.userTopicStatistic.findUnique({
    where: { userStatisticsId_topicId_difficulty: { userStatisticsId: userId, topicId, difficulty } },
  });
  const nextBreakdown = applyResult(
    breakdown ?? { gamesPlayed: 0, gamesWon: 0, totalAttemptsOnWins: 0, totalHintsUsed: 0 },
    result,
  );

  await prisma.userTopicStatistic.upsert({
    where: { userStatisticsId_topicId_difficulty: { userStatisticsId: userId, topicId, difficulty } },
    update: nextBreakdown,
    create: { userStatisticsId: userId, topicId, difficulty, ...nextBreakdown },
  });
}
