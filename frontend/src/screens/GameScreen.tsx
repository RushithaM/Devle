import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { GameSession } from "../api/types";
import { Board } from "../components/Board";
import { Header } from "../components/Header";
import { HintPanel } from "../components/HintPanel";
import { Keyboard } from "../components/Keyboard";
import { ResultScreen } from "../components/ResultScreen";
import { useAppData } from "../state/AppDataContext";
import { useServerGame } from "../state/useServerGame";

interface GameScreenProps {
  mode: "daily" | "practice";
}

function difficultyLabel(difficulty: string): string {
  return difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
}

function toResultChallenge(session: GameSession) {
  return {
    answer: session.answer ?? "",
    explanation: session.explanation ?? "",
    relatedConcepts: session.relatedConcepts ?? [],
    interviewTip: session.interviewTip ?? undefined,
  };
}

export function GameScreen({ mode }: GameScreenProps) {
  const { topic: topicParam } = useParams<{ topic: string }>();
  const navigate = useNavigate();
  const { streak, difficulty, refreshProfile } = useAppData();
  const game = useServerGame();

  useEffect(() => {
    if (mode === "daily") {
      void game.start({ mode: "daily", difficulty });
      return;
    }
    if (topicParam) {
      void game.start({ mode: "daily", topicId: topicParam, difficulty });
    }
    // start is stable; we only re-run when the play target changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, topicParam, difficulty]);

  useEffect(() => {
    if (game.session && game.session.status !== "PLAYING") {
      void refreshProfile();
    }
  }, [game.session, refreshProfile]);

  useEffect(() => {
    if (!game.session || game.session.status !== "PLAYING") return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        void game.submit();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        game.backspace();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        game.typeLetter(e.key);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [game.session, game.submit, game.backspace, game.typeLetter]);

  const handleDone = () => navigate("/");
  const session = game.session;
  const finished = session !== null && session.status !== "PLAYING";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4">
      <Header onBack={handleDone} />

      {game.loading && (
        <p className="mt-10 text-center text-sm text-text-dim">Setting up your game…</p>
      )}

      {game.error && !session && (
        <p className="mt-10 text-center text-sm text-danger">{game.error}</p>
      )}

      {session && (
        <>
          <div className="mb-4 text-center">
            <p className="font-mono text-xs font-bold uppercase tracking-wide text-accent">
              {session.topic.shortName} · {difficultyLabel(session.difficulty)}
            </p>
          </div>

          {finished ? (
            <ResultScreen
              challenge={toResultChallenge(session)}
              results={session.guesses.map((g) => g.result)}
              maxAttempts={session.maxAttempts}
              won={session.status === "WON"}
              hintsUsed={session.hintsUsed as 0 | 1 | 2}
              streak={session.mode === "DAILY" ? streak : undefined}
              dayNumber={session.dayNumber}
              topicShortName={session.topic.shortName}
              onDone={handleDone}
            />
          ) : (
            <div className="flex flex-1 flex-col gap-5 pb-6">
              <p className="text-center text-base font-medium leading-snug text-text sm:text-lg">
                {session.question}
              </p>

              <HintPanel
                revealedHints={session.revealedHints}
                onReveal={() => void game.revealHint()}
                disabled={game.submitting}
              />

              <div className="flex flex-1 flex-col items-center justify-center gap-4">
                <Board
                  answerLength={session.answerLength}
                  maxAttempts={session.maxAttempts}
                  guesses={session.guesses.map((g) => g.guess)}
                  results={session.guesses.map((g) => g.result)}
                  currentInput={game.currentInput}
                  invalidShake={game.invalidShake}
                />
                <p className="font-mono text-xs text-text-dim">
                  Attempt {session.attempts} / {session.maxAttempts}
                </p>
              </div>

              {game.error && <p className="text-center text-sm text-danger">{game.error}</p>}

              <Keyboard
                keyboardState={game.keyboardState}
                onKey={game.typeLetter}
                onEnter={() => void game.submit()}
                onBackspace={game.backspace}
                disabled={game.submitting}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
