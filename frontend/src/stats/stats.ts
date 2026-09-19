import type { Stats } from "../storage/persistence";

export function updateStatistics(
  stats: Stats,
  result: { won: boolean; attempts: number },
): Stats {
  return {
    gamesPlayed: stats.gamesPlayed + 1,
    gamesWon: stats.gamesWon + (result.won ? 1 : 0),
    totalAttemptsOnWins:
      stats.totalAttemptsOnWins + (result.won ? result.attempts : 0),
  };
}

export function getWinRate(stats: Stats): number {
  if (stats.gamesPlayed === 0) return 0;
  return stats.gamesWon / stats.gamesPlayed;
}

/** Null when there are no wins yet — there's nothing meaningful to average. */
export function getAverageAttempts(stats: Stats): number | null {
  if (stats.gamesWon === 0) return null;
  return stats.totalAttemptsOnWins / stats.gamesWon;
}
