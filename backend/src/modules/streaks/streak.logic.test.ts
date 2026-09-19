import { describe, expect, it } from "vitest";
import { getDisplayStreak, hasCompletedToday, recordCompletion, type StreakState } from "./streak.logic";

const INITIAL: StreakState = { currentStreak: 0, bestStreak: 0, lastCompletedDateKey: null };
const day = (n: number) => new Date(Date.UTC(2026, 0, n));

describe("recordCompletion", () => {
  it("starts a streak at 1 on the first completion", () => {
    const state = recordCompletion(INITIAL, day(1));
    expect(state.currentStreak).toBe(1);
    expect(state.bestStreak).toBe(1);
  });

  it("increments on consecutive UTC days", () => {
    let state = recordCompletion(INITIAL, day(1));
    state = recordCompletion(state, day(2));
    state = recordCompletion(state, day(3));
    expect(state.currentStreak).toBe(3);
  });

  it("is idempotent for repeated completions on the same UTC day", () => {
    let state = recordCompletion(INITIAL, day(1));
    state = recordCompletion(state, day(1));
    expect(state.currentStreak).toBe(1);
  });

  it("resets to 1 after a missed day", () => {
    let state = recordCompletion(INITIAL, day(1));
    state = recordCompletion(state, day(2));
    state = recordCompletion(state, day(4)); // day 3 skipped
    expect(state.currentStreak).toBe(1);
  });

  it("keeps the best streak after the current one resets", () => {
    let state = recordCompletion(INITIAL, day(1));
    state = recordCompletion(state, day(2));
    state = recordCompletion(state, day(3));
    state = recordCompletion(state, day(10));
    expect(state.currentStreak).toBe(1);
    expect(state.bestStreak).toBe(3);
  });
});

describe("getDisplayStreak", () => {
  it("shows the streak the day after completion, before it resets", () => {
    const state = recordCompletion(INITIAL, day(5));
    expect(getDisplayStreak(state, day(6))).toBe(1);
  });

  it("shows 0 once more than a day has passed", () => {
    const state = recordCompletion(INITIAL, day(5));
    expect(getDisplayStreak(state, day(7))).toBe(0);
  });
});

describe("hasCompletedToday", () => {
  it("is true only on the exact UTC day of the last completion", () => {
    const state = recordCompletion(INITIAL, day(5));
    expect(hasCompletedToday(state, day(5))).toBe(true);
    expect(hasCompletedToday(state, day(6))).toBe(false);
  });
});
