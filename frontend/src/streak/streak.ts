import { addDays, formatDateKey } from "../lib/date";

export interface StreakState {
  current: number;
  best: number;
  lastCompletedDateKey: string | null;
}

export const INITIAL_STREAK_STATE: StreakState = {
  current: 0,
  best: 0,
  lastCompletedDateKey: null,
};

/**
 * Call once when the user finishes a Daily Devle. Completing the daily
 * challenge IS the check-in — there's no separate action required.
 * Idempotent: completing more than once on the same day has no extra effect.
 * Practice games never call this; they don't affect the daily streak.
 */
export function recordDailyCompletion(
  state: StreakState,
  date: Date = new Date(),
): StreakState {
  const today = formatDateKey(date);

  if (state.lastCompletedDateKey === today) {
    return state;
  }

  const yesterday = addDays(today, -1);
  const current =
    state.lastCompletedDateKey === yesterday ? state.current + 1 : 1;

  return {
    current,
    best: Math.max(state.best, current),
    lastCompletedDateKey: today,
  };
}

/**
 * The streak value to show the user right now. Derived from stored state
 * rather than mutated eagerly, so a missed day reads as broken (0) the
 * moment the app is opened again — no background job or manual check-in
 * needed to notice the gap.
 */
export function getDisplayStreak(
  state: StreakState,
  date: Date = new Date(),
): number {
  if (!state.lastCompletedDateKey) return 0;

  const today = formatDateKey(date);
  const yesterday = addDays(today, -1);

  if (
    state.lastCompletedDateKey === today ||
    state.lastCompletedDateKey === yesterday
  ) {
    return state.current;
  }

  return 0;
}

export function hasCompletedToday(
  state: StreakState,
  date: Date = new Date(),
): boolean {
  return state.lastCompletedDateKey === formatDateKey(date);
}
