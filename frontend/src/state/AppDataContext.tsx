import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "../api/client";
import { listTopics } from "../api/topics";
import { getProfile, updatePreference } from "../api/users";
import type { Difficulty, StatisticsSummary, StreakSummary, Topic, UserPreference } from "../api/types";
import { getDisplayStreak } from "../streak/streak";
import { getAverageAttempts, getWinRate } from "../stats/stats";
import { devleStorage, type Stats, type Theme } from "../storage/persistence";
import { useAuth } from "./AuthContext";

interface AppDataValue {
  streak: number;
  bestStreak: number;
  hasCompletedToday: boolean;
  stats: Stats;
  winRate: number;
  averageAttempts: number | null;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  difficulty: Difficulty;
  setDifficulty: (difficulty: Difficulty) => Promise<void>;
  topics: Topic[];
  profileName: string | null;
  profileEmail: string | null;
  refreshProfile: () => Promise<void>;
  loadingProfile: boolean;
}

const AppDataContext = createContext<AppDataValue | null>(null);

const EMPTY_STREAK: StreakSummary = {
  currentStreak: 0,
  bestStreak: 0,
  hasCompletedToday: false,
};

const EMPTY_STATS: StatisticsSummary = {
  gamesPlayed: 0,
  gamesWon: 0,
  winRate: 0,
  averageAttempts: null,
};

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = resolveTheme(theme);
}

function localStreakFallback(): StreakSummary {
  const local = devleStorage.getStreak();
  const today = new Date();
  return {
    currentStreak: getDisplayStreak(local, today),
    bestStreak: local.best,
    hasCompletedToday: local.lastCompletedDateKey === formatLocalDate(today),
  };
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<Theme>(() => devleStorage.getTheme());
  const [streak, setStreak] = useState<StreakSummary>(EMPTY_STREAK);
  const [stats, setStats] = useState<StatisticsSummary>(EMPTY_STATS);
  const [preference, setPreference] = useState<UserPreference>({ difficulty: "MEDIUM", topicId: null });
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme(theme);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    devleStorage.setTheme(next);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setStreak(localStreakFallback());
      const localStats = devleStorage.getStats();
      setStats({
        gamesPlayed: localStats.gamesPlayed,
        gamesWon: localStats.gamesWon,
        winRate: getWinRate(localStats),
        averageAttempts: getAverageAttempts(localStats),
      });
      return;
    }

    setLoadingProfile(true);
    try {
      const [profile, topicRes] = await Promise.all([getProfile(), listTopics()]);
      setStreak(profile.streak);
      setStats(profile.statistics);
      setPreference(profile.preference);
      setTopics(topicRes.topics);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setStreak(EMPTY_STREAK);
        setStats(EMPTY_STATS);
      }
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const setDifficulty = useCallback(async (difficulty: Difficulty) => {
    setPreference((prev) => ({ ...prev, difficulty }));
    const next = await updatePreference({ difficulty });
    setPreference(next);
  }, []);

  const value = useMemo<AppDataValue>(
    () => ({
      streak: streak.currentStreak,
      bestStreak: streak.bestStreak,
      hasCompletedToday: streak.hasCompletedToday,
      stats: {
        gamesPlayed: stats.gamesPlayed,
        gamesWon: stats.gamesWon,
        totalAttemptsOnWins: 0,
      },
      winRate: stats.winRate,
      averageAttempts: stats.averageAttempts,
      theme,
      setTheme,
      difficulty: preference.difficulty,
      setDifficulty,
      topics,
      profileName: user?.name ?? null,
      profileEmail: user?.email ?? null,
      refreshProfile,
      loadingProfile,
    }),
    [
      streak,
      stats,
      theme,
      setTheme,
      preference.difficulty,
      setDifficulty,
      topics,
      user,
      refreshProfile,
      loadingProfile,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
