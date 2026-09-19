import { describe, expect, it } from "vitest";
import {
  applyGuess,
  createGameState,
  DEFAULT_MAX_ATTEMPTS,
  evaluateGuess,
  getGameStatus,
  getKeyboardState,
  isGameOver,
  isValidWord,
  isWinningGuess,
} from "./wordle";

describe("evaluateGuess", () => {
  it("marks every letter correct on an exact match", () => {
    const result = evaluateGuess("STACK", "STACK");
    expect(result.map((r) => r.status)).toEqual([
      "correct",
      "correct",
      "correct",
      "correct",
      "correct",
    ]);
  });

  it("marks letters absent when they don't appear in the answer", () => {
    const result = evaluateGuess("STACK", "PRONE");
    expect(result.map((r) => r.status)).toEqual([
      "absent",
      "absent",
      "absent",
      "absent",
      "absent",
    ]);
  });

  it("marks a letter present when it exists but in the wrong position", () => {
    // answer CACHE, guess TEACH -> T absent, E present, A correct? let's use simpler case
    const result = evaluateGuess("QUEUE", "EQUAL");
    // Q U E U E vs E Q U A L
    // i0: E vs Q -> Q is in answer -> present
    // i1: Q vs U -> U is in answer -> present
    // i2: U vs E -> E is in answer -> present
    // i3: A vs U -> A not in answer -> absent
    // i4: L vs E -> L not in answer -> absent
    expect(result.map((r) => r.status)).toEqual([
      "present",
      "present",
      "present",
      "absent",
      "absent",
    ]);
  });

  it("handles a guess with one occurrence when the answer has a duplicate letter", () => {
    // answer QUEUE has two U's and two E's; guess GUESS has a single U and single E
    const result = evaluateGuess("QUEUE", "GUESS");
    // G U E S S vs Q U E U E
    // i0: G vs Q -> absent
    // i1: U vs U -> correct
    // i2: E vs E -> correct
    // i3: S vs U -> absent (no S in answer)
    // i4: S vs E -> absent
    expect(result.map((r) => r.status)).toEqual([
      "absent",
      "correct",
      "correct",
      "absent",
      "absent",
    ]);
  });

  it("does not over-count duplicate letters in the guess beyond the answer's supply", () => {
    // answer has exactly one 'S'; guess has three 'S's, only one should be flagged (correct or present)
    const result = evaluateGuess("CLOSURE", "SSSSSSS".slice(0, 7));
    // answer: C L O S U R E (one S at index 3)
    // guess:  S S S S S S S
    // i3 matches exactly -> correct; every other S must be absent since supply is exhausted
    expect(result[3]!.status).toBe("correct");
    const others = result.filter((_, i) => i !== 3);
    expect(others.every((r) => r.status === "absent")).toBe(true);
  });

  it("marks duplicate letters absent once the answer's supply is exhausted by exact matches", () => {
    // answer PROCESS has two S's and one C, both fully consumed by exact matches in SUCCESS
    const result = evaluateGuess("PROCESS", "SUCCESS");
    expect(result.map((r) => r.status)).toEqual([
      "absent", // S - both S's already consumed by the exact matches at index 5 and 6
      "absent", // U - not in answer
      "absent", // C - the answer's only C is consumed by the exact match at index 3
      "correct", // C
      "correct", // E
      "correct", // S
      "correct", // S
    ]);
  });

  it("evaluates multiple duplicate letters correctly when both answer and guess repeat them", () => {
    // answer: ERROR (E R R O R) - R appears twice
    // guess:  ROARS - wrong length for ERROR (5 vs 5, ok) R O A R S
    const result = evaluateGuess("ERROR", "ROARS");
    // answer letters: E R R O R -> counts R:3? wait ERROR = E,R,R,O,R -> R appears 3 times, O once, E once
    // guess: R O A R S
    // i0: R vs E -> R exists in answer -> present (consume one R)
    // i1: O vs R -> O exists in answer -> present (consume the O)
    // i2: A vs R -> A not in answer -> absent
    // i3: R vs O -> R exists (2 left) -> present (consume another R)
    // i4: S vs R -> absent
    expect(result.map((r) => r.status)).toEqual([
      "present",
      "present",
      "absent",
      "present",
      "absent",
    ]);
  });

  it("is case-insensitive", () => {
    const result = evaluateGuess("stack", "STACK");
    expect(result.every((r) => r.status === "correct")).toBe(true);
  });

  it("throws when guess length does not match answer length", () => {
    expect(() => evaluateGuess("STACK", "QUEUE1")).toThrow();
  });

  it("handles longer answers correctly (POLYMORPHISM, 12 letters)", () => {
    const result = evaluateGuess("POLYMORPHISM", "POLYMORPHISM");
    expect(result).toHaveLength(12);
    expect(result.every((r) => r.status === "correct")).toBe(true);
  });
});

describe("isValidWord", () => {
  it("accepts alphabetic words matching the expected length", () => {
    expect(isValidWord("STACK", 5)).toBe(true);
  });

  it("rejects words with the wrong length", () => {
    expect(isValidWord("STACKS", 5)).toBe(false);
  });

  it("rejects words containing non-letter characters", () => {
    expect(isValidWord("ST4CK", 5)).toBe(false);
    expect(isValidWord("ST-CK", 5)).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isValidWord("stack", 5)).toBe(true);
  });

  it("rejects empty input", () => {
    expect(isValidWord("", 5)).toBe(false);
  });
});

describe("isWinningGuess", () => {
  it("returns true for an exact case-insensitive match", () => {
    expect(isWinningGuess("DEADLOCK", "deadlock")).toBe(true);
  });

  it("returns false for a non-matching guess", () => {
    expect(isWinningGuess("DEADLOCK", "RECURSION")).toBe(false);
  });
});

describe("getGameStatus / isGameOver", () => {
  it("reports playing when guesses remain and no win yet", () => {
    let state = createGameState("STACK");
    state = applyGuess(state, "TRACK");
    expect(getGameStatus(state)).toBe("playing");
    expect(isGameOver(state)).toBe(false);
  });

  it("reports won when the final guess matches the answer", () => {
    let state = createGameState("STACK");
    state = applyGuess(state, "STACK");
    expect(getGameStatus(state)).toBe("won");
    expect(isGameOver(state)).toBe(true);
  });

  it("reports lost after max attempts are exhausted without a win", () => {
    let state = createGameState("STACK", 2);
    state = applyGuess(state, "TRACK");
    state = applyGuess(state, "CRACK");
    expect(getGameStatus(state)).toBe("lost");
    expect(isGameOver(state)).toBe(true);
  });

  it("a win on the very last attempt still counts as won, not lost", () => {
    let state = createGameState("STACK", 2);
    state = applyGuess(state, "TRACK");
    state = applyGuess(state, "STACK");
    expect(getGameStatus(state)).toBe("won");
  });

  it("does not accept further guesses once the game is over", () => {
    let state = createGameState("STACK");
    state = applyGuess(state, "STACK");
    const finished = state;
    state = applyGuess(state, "TRACK");
    expect(state).toEqual(finished);
  });
});

describe("getKeyboardState", () => {
  it("keeps the best-known status per letter across guesses", () => {
    // First guess marks 'S' as present, second guess marks 'S' as correct.
    const first = evaluateGuess("STACK", "SPARE".slice(0, 5));
    const second = evaluateGuess("STACK", "STACK");
    const state = getKeyboardState([first, second]);
    expect(state["S"]).toBe("correct");
  });

  it("never downgrades a letter from correct to present or absent, regardless of guess order", () => {
    const presentGuess = evaluateGuess("STACK", "TRACK"); // T is present here
    const correctGuess = evaluateGuess("STACK", "STACK"); // T is correct here
    expect(getKeyboardState([presentGuess, correctGuess])["T"]).toBe("correct");
    expect(getKeyboardState([correctGuess, presentGuess])["T"]).toBe("correct");
  });
});

describe("createGameState", () => {
  it("defaults to 6 max attempts", () => {
    const state = createGameState("STACK");
    expect(state.maxAttempts).toBe(DEFAULT_MAX_ATTEMPTS);
    expect(state.maxAttempts).toBe(6);
  });

  it("normalizes the answer to uppercase", () => {
    const state = createGameState("stack");
    expect(state.answer).toBe("STACK");
  });
});
