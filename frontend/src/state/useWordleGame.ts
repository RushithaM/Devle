import { useCallback, useMemo, useState } from "react";
import {
  applyGuess,
  createGameState,
  getKeyboardState,
  isValidWord,
} from "../engine/wordle";
import type { GameState } from "../engine/types";

export interface WordleGame {
  state: GameState;
  currentInput: string;
  keyboardState: ReturnType<typeof getKeyboardState>;
  invalidShake: boolean;
  typeLetter: (letter: string) => void;
  backspace: () => void;
  submit: () => void;
}

/** Drives one play session against the engine: input buffer, submission, and derived keyboard state. */
export function useWordleGame(answer: string, maxAttempts = 6): WordleGame {
  const [state, setState] = useState<GameState>(() =>
    createGameState(answer, maxAttempts),
  );
  const [currentInput, setCurrentInput] = useState("");
  const [invalidShake, setInvalidShake] = useState(false);

  const answerLength = state.answer.length;

  const typeLetter = useCallback(
    (letter: string) => {
      if (state.status !== "playing") return;
      if (!/^[a-zA-Z]$/.test(letter)) return;
      setCurrentInput((prev) =>
        prev.length < answerLength ? prev + letter.toUpperCase() : prev,
      );
    },
    [answerLength, state.status],
  );

  const backspace = useCallback(() => {
    if (state.status !== "playing") return;
    setCurrentInput((prev) => prev.slice(0, -1));
  }, [state.status]);

  const submit = useCallback(() => {
    if (state.status !== "playing") return;
    if (!isValidWord(currentInput, answerLength)) {
      setInvalidShake(true);
      window.setTimeout(() => setInvalidShake(false), 500);
      return;
    }
    setState((prev) => applyGuess(prev, currentInput));
    setCurrentInput("");
  }, [currentInput, answerLength, state.status]);

  const keyboardState = useMemo(
    () => getKeyboardState(state.results),
    [state.results],
  );

  return { state, currentInput, keyboardState, invalidShake, typeLetter, backspace, submit };
}
