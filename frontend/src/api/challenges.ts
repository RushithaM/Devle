import { apiRequest } from "./client";
import type { DailyPreview, Difficulty, PublicChallenge } from "./types";

export function getDailyChallenge(difficulty?: Difficulty) {
  const query = difficulty ? `?difficulty=${difficulty}` : "";
  return apiRequest<DailyPreview>(`/api/challenges/daily${query}`);
}

export function getPracticeChallenge(topic: string, difficulty: Difficulty) {
  return apiRequest<{ challenge: PublicChallenge }>(
    `/api/challenges/practice?topic=${encodeURIComponent(topic)}&difficulty=${difficulty}`,
  );
}
