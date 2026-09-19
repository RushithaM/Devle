export type LetterStatus = "correct" | "present" | "absent";

export interface LetterResult {
  letter: string;
  status: LetterStatus;
}

export type GuessResult = LetterResult[];

export type GameStatus = "playing" | "won" | "lost";

export interface GameState {
  answer: string;
  maxAttempts: number;
  guesses: string[];
  results: GuessResult[];
  status: GameStatus;
}

/** Best-known status per letter, for keyboard highlighting. Precedence: correct > present > absent. */
export type KeyboardState = Record<string, LetterStatus>;
