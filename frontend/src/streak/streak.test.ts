import { describe, expect, it } from "vitest";
import {
  getDisplayStreak,
  hasCompletedToday,
  INITIAL_STREAK_STATE,
  recordDailyCompletion,
} from "./streak";

const day = (n: number) => new Date(2026, 0, n);

describe("recordDailyCompletion", () => {
  it("starts a streak at 1 on the first completion", () => {
    const state = recordDailyCompletion(INITIAL_STREAK_STATE, day(1));
    expect(state.current).toBe(1);
    expect(state.best).toBe(1);
  });

  it("increments the streak when completed on consecutive days", () => {
    let state = recordDailyCompletion(INITIAL_STREAK_STATE, day(1));
    state = recordDailyCompletion(state, day(2));
    state = recordDailyCompletion(state, day(3));
    expect(state.current).toBe(3);
    expect(state.best).toBe(3);
  });

  it("is idempotent for repeated completions on the same day", () => {
    let state = recordDailyCompletion(INITIAL_STREAK_STATE, day(1));
    state = recordDailyCompletion(state, day(1));
    state = recordDailyCompletion(state, day(1));
    expect(state.current).toBe(1);
  });

  it("resets the streak to 1 after a missed day", () => {
    let state = recordDailyCompletion(INITIAL_STREAK_STATE, day(1));
    state = recordDailyCompletion(state, day(2));
    // day 3 is skipped entirely
    state = recordDailyCompletion(state, day(4));
    expect(state.current).toBe(1);
  });

  it("keeps the best streak even after the current streak resets", () => {
    let state = recordDailyCompletion(INITIAL_STREAK_STATE, day(1));
    state = recordDailyCompletion(state, day(2));
    state = recordDailyCompletion(state, day(3));
    // gap -> resets
    state = recordDailyCompletion(state, day(10));
    expect(state.current).toBe(1);
    expect(state.best).toBe(3);
  });
});

describe("getDisplayStreak", () => {
  it("shows the current streak when last completed today", () => {
    const state = recordDailyCompletion(INITIAL_STREAK_STATE, day(5));
    expect(getDisplayStreak(state, day(5))).toBe(1);
  });

  it("still shows the streak the next day before it's been re-completed", () => {
    const state = recordDailyCompletion(INITIAL_STREAK_STATE, day(5));
    expect(getDisplayStreak(state, day(6))).toBe(1);
  });

  it("shows 0 once more than one full day has passed without completion", () => {
    const state = recordDailyCompletion(INITIAL_STREAK_STATE, day(5));
    expect(getDisplayStreak(state, day(7))).toBe(0);
  });

  it("shows 0 for a fresh state with no completions", () => {
    expect(getDisplayStreak(INITIAL_STREAK_STATE, day(1))).toBe(0);
  });
});

describe("hasCompletedToday", () => {
  it("is true only for the exact day of the last completion", () => {
    const state = recordDailyCompletion(INITIAL_STREAK_STATE, day(5));
    expect(hasCompletedToday(state, day(5))).toBe(true);
    expect(hasCompletedToday(state, day(6))).toBe(false);
  });
});
