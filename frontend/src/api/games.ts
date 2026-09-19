import { apiRequest } from "./client";
import type { Difficulty, GameSession, HintResponse } from "./types";

export function createDailyGame(difficulty?: Difficulty, topicId?: string) {
  return apiRequest<GameSession>("/api/games", {
    method: "POST",
    body: JSON.stringify({ mode: "DAILY", difficulty, topicId }),
  });
}

export function createPracticeGame(topicId: string, difficulty: Difficulty) {
  return apiRequest<GameSession>("/api/games", {
    method: "POST",
    body: JSON.stringify({ mode: "PRACTICE", topicId, difficulty }),
  });
}

export function getGame(id: string) {
  return apiRequest<GameSession>(`/api/games/${id}`);
}

export function submitGuess(id: string, guess: string) {
  return apiRequest<GameSession>(`/api/games/${id}/guess`, {
    method: "POST",
    body: JSON.stringify({ guess }),
  });
}

export function requestHint(id: string) {
  return apiRequest<HintResponse>(`/api/games/${id}/hint`, { method: "POST" });
}
