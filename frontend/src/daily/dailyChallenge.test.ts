import { describe, expect, it } from "vitest";
import { formatDateKey, getDailyChallenge, getDayNumber } from "./dailyChallenge";

describe("formatDateKey", () => {
  it("formats a local date as YYYY-MM-DD", () => {
    expect(formatDateKey(new Date(2026, 8, 19))).toBe("2026-09-19");
  });

  it("zero-pads single-digit months and days", () => {
    expect(formatDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("getDayNumber", () => {
  it("returns 1 for the epoch day", () => {
    expect(getDayNumber(new Date(2024, 0, 1))).toBe(1);
  });

  it("increments by 1 for each following day", () => {
    expect(getDayNumber(new Date(2024, 0, 2))).toBe(2);
    expect(getDayNumber(new Date(2024, 0, 31))).toBe(31);
  });
});

describe("getDailyChallenge", () => {
  it("is deterministic: same topic + same date always returns the same challenge", () => {
    const date = new Date(2026, 8, 19);
    const first = getDailyChallenge("dsa", date);
    const second = getDailyChallenge("dsa", date);
    expect(first.challenge.id).toBe(second.challenge.id);
  });

  it("returns a challenge belonging to the requested topic", () => {
    const { challenge } = getDailyChallenge("javascript", new Date(2026, 8, 19));
    expect(challenge.topic).toBe("javascript");
  });

  it("varies the challenge across different dates (not the same one every day)", () => {
    const results = new Set<string>();
    for (let day = 1; day <= 15; day++) {
      results.add(getDailyChallenge("dsa", new Date(2026, 0, day)).challenge.id);
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it("varies the challenge across different topics on the same date", () => {
    const date = new Date(2026, 8, 19);
    const dsa = getDailyChallenge("dsa", date);
    const git = getDailyChallenge("git", date);
    expect(dsa.challenge.topic).not.toBe(git.challenge.topic);
  });

  it("reports the day number and date key alongside the challenge", () => {
    const result = getDailyChallenge("dsa", new Date(2024, 0, 1));
    expect(result.dayNumber).toBe(1);
    expect(result.dateKey).toBe("2024-01-01");
  });

  it("throws for a topic with no challenges", () => {
    // @ts-expect-error intentionally invalid topic to exercise the guard
    expect(() => getDailyChallenge("not-a-real-topic", new Date())).toThrow();
  });
});
