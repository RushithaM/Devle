import { useCallback, useMemo, useState } from "react";
import { ApiError } from "../api/client";
import { createDailyGame, createPracticeGame, requestHint, submitGuess } from "../api/games";
import type { Difficulty, GameSession } from "../api/types";
import { getKeyboardState, isValidWord } from "../engine/wordle";

interface StartDaily {
  mode: "daily";
  difficulty?: Difficulty;
  topicId?: string;
}

interface StartPractice {
  mode: "practice";
  topicId: string;
  difficulty: Difficulty;
}

export type StartGameInput = StartDaily | StartPractice;

export function useServerGame() {
  const [session, setSession] = useState<GameSession | null>(null);
  const [currentInput, setCurrentInput] = useState("");
  const [invalidShake, setInvalidShake] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (input: StartGameInput) => {
    setLoading(true);
    setError(null);
    setCurrentInput("");
    try {
      const next =
        input.mode === "daily"
          ? await createDailyGame(input.difficulty, input.topicId)
          : await createPracticeGame(input.topicId, input.difficulty);
      setSession(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start the game.");
    } finally {
      setLoading(false);
    }
  }, []);

  const typeLetter = useCallback(
    (letter: string) => {
      if (!session || session.status !== "PLAYING" || submitting) return;
      if (!/^[a-zA-Z]$/.test(letter)) return;
      setCurrentInput((prev) =>
        prev.length < session.answerLength ? prev + letter.toUpperCase() : prev,
      );
    },
    [session, submitting],
  );

  const backspace = useCallback(() => {
    if (!session || session.status !== "PLAYING" || submitting) return;
    setCurrentInput((prev) => prev.slice(0, -1));
  }, [session, submitting]);

  const submit = useCallback(async () => {
    if (!session || session.status !== "PLAYING" || submitting) return;
    if (!isValidWord(currentInput, session.answerLength)) {
      setInvalidShake(true);
      window.setTimeout(() => setInvalidShake(false), 500);
      return;
    }

    setSubmitting(true);
    try {
      const next = await submitGuess(session.id, currentInput);
      setSession(next);
      setCurrentInput("");
    } catch (err) {
      if (err instanceof ApiError && err.code === "INVALID_GUESS") {
        setInvalidShake(true);
        window.setTimeout(() => setInvalidShake(false), 500);
      } else {
        setError(err instanceof ApiError ? err.message : "Could not submit that guess.");
      }
    } finally {
      setSubmitting(false);
    }
  }, [session, currentInput, submitting]);

  const revealHint = useCallback(async () => {
    if (!session || session.status !== "PLAYING" || submitting) return;
    setSubmitting(true);
    try {
      const hint = await requestHint(session.id);
      setSession((prev) =>
        prev
          ? {
              ...prev,
              hintsUsed: hint.hintsUsed,
              revealedHints: [...prev.revealedHints, hint.text],
            }
          : prev,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reveal a hint.");
    } finally {
      setSubmitting(false);
    }
  }, [session, submitting]);

  const keyboardState = useMemo(
    () => getKeyboardState(session?.guesses.map((g) => g.result) ?? []),
    [session],
  );

  return {
    session,
    currentInput,
    keyboardState,
    invalidShake,
    loading,
    submitting,
    error,
    start,
    typeLetter,
    backspace,
    submit,
    revealHint,
  };
}
