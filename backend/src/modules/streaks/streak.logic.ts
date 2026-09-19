import { addDaysToDateKey, dateKeyUTC } from "../../utils/date";

export interface StreakState {
  currentStreak: number;
  bestStreak: number;
  lastCompletedDateKey: string | null;
}

/**
 * Pure streak transition, mirroring the original client-side logic but keyed
 * off the server's UTC calendar day instead of the browser's local clock —
 * this is the backend's source of truth now, not a fallback.
 */
export function recordCompletion(state: StreakState, now: Date = new Date()): StreakState {
  const today = dateKeyUTC(now);

  if (state.lastCompletedDateKey === today) {
    return state; // already counted today — completing again doesn't double-count
  }

  const yesterday = addDaysToDateKey(today, -1);
  const currentStreak =
    state.lastCompletedDateKey === yesterday ? state.currentStreak + 1 : 1;

  return {
    currentStreak,
    bestStreak: Math.max(state.bestStreak, currentStreak),
    lastCompletedDateKey: today,
  };
}

/** What to display right now — 0 the moment more than a day has passed since the last completion. */
export function getDisplayStreak(state: StreakState, now: Date = new Date()): number {
  if (!state.lastCompletedDateKey) return 0;

  const today = dateKeyUTC(now);
  const yesterday = addDaysToDateKey(today, -1);

  if (state.lastCompletedDateKey === today || state.lastCompletedDateKey === yesterday) {
    return state.currentStreak;
  }
  return 0;
}

export function hasCompletedToday(state: StreakState, now: Date = new Date()): boolean {
  return state.lastCompletedDateKey === dateKeyUTC(now);
}
