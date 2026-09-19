export interface StatTotals {
  gamesPlayed: number;
  gamesWon: number;
  totalAttemptsOnWins: number;
  totalHintsUsed: number;
}

export interface GameResult {
  won: boolean;
  attempts: number;
  hintsUsed: number;
}

export function applyResult(totals: StatTotals, result: GameResult): StatTotals {
  return {
    gamesPlayed: totals.gamesPlayed + 1,
    gamesWon: totals.gamesWon + (result.won ? 1 : 0),
    totalAttemptsOnWins: totals.totalAttemptsOnWins + (result.won ? result.attempts : 0),
    totalHintsUsed: totals.totalHintsUsed + result.hintsUsed,
  };
}

export function winRate(totals: StatTotals): number {
  if (totals.gamesPlayed === 0) return 0;
  return totals.gamesWon / totals.gamesPlayed;
}

export function averageAttempts(totals: StatTotals): number | null {
  if (totals.gamesWon === 0) return null;
  return totals.totalAttemptsOnWins / totals.gamesWon;
}
