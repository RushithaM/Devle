import type { GuessResult } from "../engine/types";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type GameMode = "DAILY" | "PRACTICE";
export type GameStatus = "PLAYING" | "WON" | "LOST";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: PublicUser;
  token: string;
}

export interface Topic {
  id: string;
  name: string;
  shortName: string;
  description: string;
  sortOrder: number;
}

export interface PublicChallenge {
  id: string;
  topicId: string;
  question: string;
  difficulty: Difficulty;
  answerLength: number;
}

export interface DailyPreview {
  date: string;
  dayNumber: number;
  topic: Pick<Topic, "id" | "name" | "shortName">;
  difficulty: Difficulty;
  challenge: PublicChallenge;
  completedTopicIds: string[];
  gameSession: {
    id: string;
    status: GameStatus;
    attempts: number;
    maxAttempts: number;
    hintsUsed: number;
  } | null;
}

export interface GameGuess {
  guess: string;
  result: GuessResult;
  attemptNumber: number;
}

export interface GameSession {
  id: string;
  mode: GameMode;
  status: GameStatus;
  attempts: number;
  maxAttempts: number;
  hintsUsed: number;
  answerLength: number;
  topic: Pick<Topic, "id" | "name" | "shortName">;
  difficulty: Difficulty;
  question: string;
  dayNumber?: number;
  revealedHints: string[];
  guesses: GameGuess[];
  answer?: string;
  explanation?: string;
  relatedConcepts?: string[];
  interviewTip?: string | null;
}

export interface HintResponse {
  hintNumber: number;
  text: string;
  hintsUsed: number;
}

export interface UserPreference {
  difficulty: Difficulty;
  topicId: string | null;
}

export interface StreakSummary {
  currentStreak: number;
  bestStreak: number;
  hasCompletedToday: boolean;
}

export interface StatisticsSummary {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  averageAttempts: number | null;
}

export interface UserProfile {
  user: PublicUser;
  preference: UserPreference;
  streak: StreakSummary;
  statistics: StatisticsSummary;
}

export interface MigrateLocalPayload {
  streak?: {
    current: number;
    best: number;
    lastCompletedDateKey: string | null;
  };
  statistics?: {
    gamesPlayed: number;
    gamesWon: number;
    totalAttemptsOnWins: number;
  };
}
