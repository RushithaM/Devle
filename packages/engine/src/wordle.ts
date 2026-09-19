import type {
  GameState,
  GameStatus,
  GuessResult,
  KeyboardState,
  LetterStatus,
} from "./types";

export const DEFAULT_MAX_ATTEMPTS = 6;

function normalize(word: string): string {
  return word.trim().toUpperCase();
}

/**
 * Evaluates a single guess against the answer using Wordle-style rules.
 * Uses a two-pass algorithm so duplicate letters are scored against the
 * remaining supply of that letter in the answer, not the whole answer.
 */
export function evaluateGuess(answer: string, guess: string): GuessResult {
  const ans = normalize(answer).split("");
  const gus = normalize(guess).split("");

  if (ans.length !== gus.length) {
    throw new Error(
      `Guess length (${gus.length}) must match answer length (${ans.length})`,
    );
  }

  const remaining: Record<string, number> = {};
  for (const letter of ans) {
    remaining[letter] = (remaining[letter] ?? 0) + 1;
  }

  const statuses: LetterStatus[] = new Array(ans.length).fill("absent");

  // Pass 1: exact position matches consume from the remaining letter pool first.
  for (let i = 0; i < ans.length; i++) {
    if (gus[i] === ans[i]) {
      statuses[i] = "correct";
      remaining[gus[i]]! -= 1;
    }
  }

  // Pass 2: any letter that exists elsewhere in the answer, limited by what's left.
  for (let i = 0; i < ans.length; i++) {
    if (statuses[i] === "correct") continue;
    const letter = gus[i];
    if ((remaining[letter] ?? 0) > 0) {
      statuses[i] = "present";
      remaining[letter]! -= 1;
    }
  }

  return gus.map((letter, i) => ({ letter, status: statuses[i]! }));
}

/** Structural validity of a guess: letters only, matching the answer's length. */
export function isValidWord(word: string, expectedLength: number): boolean {
  const normalized = normalize(word);
  return normalized.length === expectedLength && /^[A-Z]+$/.test(normalized);
}

export function isWinningGuess(answer: string, guess: string): boolean {
  return normalize(answer) === normalize(guess);
}

export function getGameStatus(
  state: Pick<GameState, "guesses" | "results" | "maxAttempts">,
): GameStatus {
  const lastResult = state.results[state.results.length - 1];
  if (lastResult && lastResult.every((r) => r.status === "correct")) {
    return "won";
  }
  if (state.guesses.length >= state.maxAttempts) {
    return "lost";
  }
  return "playing";
}

export function isGameOver(
  state: Pick<GameState, "guesses" | "results" | "maxAttempts">,
): boolean {
  return getGameStatus(state) !== "playing";
}

const STATUS_RANK: Record<LetterStatus, number> = {
  absent: 0,
  present: 1,
  correct: 2,
};

/** Best-known status per letter across all guesses so far, for keyboard highlighting. */
export function getKeyboardState(results: GuessResult[]): KeyboardState {
  const state: KeyboardState = {};
  for (const result of results) {
    for (const { letter, status } of result) {
      const current = state[letter];
      if (!current || STATUS_RANK[status] > STATUS_RANK[current]) {
        state[letter] = status;
      }
    }
  }
  return state;
}

export function createGameState(
  answer: string,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
): GameState {
  return {
    answer: normalize(answer),
    maxAttempts,
    guesses: [],
    results: [],
    status: "playing",
  };
}

/** Applies a validated guess to game state, returning a new state (does not mutate). */
export function applyGuess(state: GameState, guess: string): GameState {
  if (state.status !== "playing") return state;

  const result = evaluateGuess(state.answer, guess);
  const guesses = [...state.guesses, normalize(guess)];
  const results = [...state.results, result];
  const status = getGameStatus({ guesses, results, maxAttempts: state.maxAttempts });

  return { ...state, guesses, results, status };
}
