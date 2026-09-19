import { describe, expect, it } from "vitest";
import { INITIAL_STATS } from "../storage/persistence";
import { getAverageAttempts, getWinRate, updateStatistics } from "./stats";

describe("updateStatistics", () => {
  it("increments games played on every result", () => {
    const stats = updateStatistics(INITIAL_STATS, { won: false, attempts: 6 });
    expect(stats.gamesPlayed).toBe(1);
  });

  it("increments games won and accumulates attempts only on a win", () => {
    const stats = updateStatistics(INITIAL_STATS, { won: true, attempts: 4 });
    expect(stats.gamesWon).toBe(1);
    expect(stats.totalAttemptsOnWins).toBe(4);
  });

  it("does not accumulate attempts on a loss", () => {
    const stats = updateStatistics(INITIAL_STATS, { won: false, attempts: 6 });
    expect(stats.gamesWon).toBe(0);
    expect(stats.totalAttemptsOnWins).toBe(0);
  });
});

describe("getWinRate", () => {
  it("is 0 when no games have been played", () => {
    expect(getWinRate(INITIAL_STATS)).toBe(0);
  });

  it("computes wins divided by games played", () => {
    let stats = updateStatistics(INITIAL_STATS, { won: true, attempts: 3 });
    stats = updateStatistics(stats, { won: false, attempts: 6 });
    expect(getWinRate(stats)).toBe(0.5);
  });
});

describe("getAverageAttempts", () => {
  it("is null when there are no wins yet", () => {
    expect(getAverageAttempts(INITIAL_STATS)).toBeNull();
  });

  it("averages attempts across wins only", () => {
    let stats = updateStatistics(INITIAL_STATS, { won: true, attempts: 2 });
    stats = updateStatistics(stats, { won: true, attempts: 4 });
    stats = updateStatistics(stats, { won: false, attempts: 6 });
    expect(getAverageAttempts(stats)).toBe(3);
  });
});
