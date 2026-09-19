import { describe, expect, it } from "vitest";
import { applyResult, averageAttempts, winRate, type StatTotals } from "./statistics.logic";

const ZERO: StatTotals = { gamesPlayed: 0, gamesWon: 0, totalAttemptsOnWins: 0, totalHintsUsed: 0 };

describe("applyResult", () => {
  it("increments games played on every result", () => {
    const totals = applyResult(ZERO, { won: false, attempts: 6, hintsUsed: 1 });
    expect(totals.gamesPlayed).toBe(1);
    expect(totals.gamesWon).toBe(0);
  });

  it("accumulates attempts only on a win", () => {
    const totals = applyResult(ZERO, { won: true, attempts: 4, hintsUsed: 0 });
    expect(totals.gamesWon).toBe(1);
    expect(totals.totalAttemptsOnWins).toBe(4);
  });

  it("always accumulates hints used, win or lose", () => {
    const totals = applyResult(ZERO, { won: false, attempts: 6, hintsUsed: 2 });
    expect(totals.totalHintsUsed).toBe(2);
  });
});

describe("winRate", () => {
  it("is 0 with no games played", () => {
    expect(winRate(ZERO)).toBe(0);
  });

  it("computes wins over games played", () => {
    let totals = applyResult(ZERO, { won: true, attempts: 3, hintsUsed: 0 });
    totals = applyResult(totals, { won: false, attempts: 6, hintsUsed: 0 });
    expect(winRate(totals)).toBe(0.5);
  });
});

describe("averageAttempts", () => {
  it("is null with no wins", () => {
    expect(averageAttempts(ZERO)).toBeNull();
  });

  it("averages attempts across wins only", () => {
    let totals = applyResult(ZERO, { won: true, attempts: 2, hintsUsed: 0 });
    totals = applyResult(totals, { won: true, attempts: 4, hintsUsed: 0 });
    totals = applyResult(totals, { won: false, attempts: 6, hintsUsed: 0 });
    expect(averageAttempts(totals)).toBe(3);
  });
});
