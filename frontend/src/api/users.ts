import { apiRequest } from "./client";
import type { Difficulty, MigrateLocalPayload, StatisticsSummary, StreakSummary, UserPreference, UserProfile } from "./types";

export function getProfile() {
  return apiRequest<UserProfile>("/api/users/me");
}

export function getStatistics() {
  return apiRequest<StatisticsSummary>("/api/users/me/statistics");
}

export function getStreak() {
  return apiRequest<StreakSummary>("/api/users/me/streak");
}

export function updatePreference(updates: { difficulty?: Difficulty; topicId?: string | null }) {
  return apiRequest<UserPreference>("/api/users/me/preferences", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export function migrateLocalProgress(payload: MigrateLocalPayload) {
  return apiRequest<{ migratedStreak: boolean; migratedStatistics: boolean }>(
    "/api/users/me/migrate-local",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
