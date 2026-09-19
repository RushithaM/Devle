import type { TopicId } from "../content/types";
import { INITIAL_STREAK_STATE, type StreakState } from "../streak/streak";
import { localStorageAdapter, readJSON, writeJSON, type StorageAdapter } from "./storage";

export type Theme = "light" | "dark" | "system";

export interface DailyCompletionRecord {
  topic: TopicId;
  dateKey: string;
  challengeId: string;
  won: boolean;
  attempts: number;
  maxAttempts: number;
  hintsUsed: number;
  guesses: string[];
}

export interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  totalAttemptsOnWins: number;
}

export const INITIAL_STATS: Stats = {
  gamesPlayed: 0,
  gamesWon: 0,
  totalAttemptsOnWins: 0,
};

const KEYS = {
  streak: "devle:streak",
  stats: "devle:stats",
  theme: "devle:theme",
  dailyCompletions: "devle:daily-completions",
} as const;

/**
 * The single point of contact between the app and browser storage. UI and
 * hooks read/write through this, never `localStorage` directly, so the
 * backing store can change later without touching callers.
 */
export function createDevleStorage(adapter: StorageAdapter = localStorageAdapter) {
  return {
    getStreak(): StreakState {
      return readJSON(adapter, KEYS.streak, INITIAL_STREAK_STATE);
    },
    setStreak(state: StreakState): void {
      writeJSON(adapter, KEYS.streak, state);
    },

    getStats(): Stats {
      return readJSON(adapter, KEYS.stats, INITIAL_STATS);
    },
    setStats(stats: Stats): void {
      writeJSON(adapter, KEYS.stats, stats);
    },

    getTheme(): Theme {
      return readJSON<Theme>(adapter, KEYS.theme, "system");
    },
    setTheme(theme: Theme): void {
      writeJSON(adapter, KEYS.theme, theme);
    },

    getDailyCompletion(dateKey: string): DailyCompletionRecord | undefined {
      const all = readJSON<Record<string, DailyCompletionRecord>>(
        adapter,
        KEYS.dailyCompletions,
        {},
      );
      return all[dateKey];
    },
    setDailyCompletion(record: DailyCompletionRecord): void {
      const all = readJSON<Record<string, DailyCompletionRecord>>(
        adapter,
        KEYS.dailyCompletions,
        {},
      );
      all[record.dateKey] = record;
      writeJSON(adapter, KEYS.dailyCompletions, all);
    },

    hasLocalProgress(): boolean {
      const streak = readJSON(adapter, KEYS.streak, INITIAL_STREAK_STATE);
      const stats = readJSON(adapter, KEYS.stats, INITIAL_STATS);
      return streak.current > 0 || streak.best > 0 || stats.gamesPlayed > 0;
    },

    getLocalProgressPayload() {
      const streak = readJSON(adapter, KEYS.streak, INITIAL_STREAK_STATE);
      const stats = readJSON(adapter, KEYS.stats, INITIAL_STATS);
      if (streak.current === 0 && streak.best === 0 && stats.gamesPlayed === 0) {
        return null;
      }
      return {
        streak: {
          current: streak.current,
          best: streak.best,
          lastCompletedDateKey: streak.lastCompletedDateKey,
        },
        statistics: {
          gamesPlayed: stats.gamesPlayed,
          gamesWon: stats.gamesWon,
          totalAttemptsOnWins: stats.totalAttemptsOnWins,
        },
      };
    },
  };
}

export const devleStorage = createDevleStorage();
