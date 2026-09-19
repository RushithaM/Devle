import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDailyChallenge } from "../api/challenges";
import type { DailyPreview, Difficulty } from "../api/types";
import { DifficultyPicker } from "../components/DifficultyPicker";
import { Header } from "../components/Header";
import { StreakBadge } from "../components/StreakBadge";
import { TopicChip } from "../components/TopicChip";
import { useAppData } from "../state/AppDataContext";

function difficultyLabel(difficulty: Difficulty): string {
  return difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
}

export function HomeScreen() {
  const navigate = useNavigate();
  const { streak, hasCompletedToday, difficulty, setDifficulty, topics, loadingProfile } = useAppData();
  const [daily, setDaily] = useState<DailyPreview | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [changingDifficulty, setChangingDifficulty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingDaily(true);
    getDailyChallenge(difficulty)
      .then((preview) => {
        if (!cancelled) setDaily(preview);
      })
      .catch(() => {
        if (!cancelled) setDaily(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingDaily(false);
      });
    return () => {
      cancelled = true;
    };
  }, [difficulty]);

  const handleDifficulty = async (next: Difficulty) => {
    if (next === difficulty) return;
    setChangingDifficulty(true);
    try {
      await setDifficulty(next);
    } finally {
      setChangingDifficulty(false);
    }
  };

  const session = daily?.gameSession;
  const alreadyFinished = session?.status === "WON" || session?.status === "LOST";
  const playLabel = alreadyFinished ? "View result" : session ? "Continue" : "Play";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4">
      <Header showProfile />

      <div className="mt-2 mb-8 text-center">
        <h1 className="font-mono text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          DEVLE
        </h1>
        <p className="mt-1 text-sm text-text-dim">Think. Guess. Learn.</p>
      </div>

      <div className="mb-8 flex justify-center">
        <StreakBadge streak={streak} size="lg" />
      </div>

      <button
        type="button"
        disabled={!daily}
        onClick={() => navigate("/play/daily")}
        className="mb-8 flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 text-left shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-accent disabled:opacity-60"
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold uppercase tracking-wide text-accent">
            Today's Devle
          </span>
          {(hasCompletedToday || alreadyFinished) && (
            <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-text-dim">
              Solved today
            </span>
          )}
        </div>
        {loadingDaily || !daily ? (
          <p className="text-sm text-text-dim">{loadingProfile || loadingDaily ? "Loading today's challenge…" : "Could not load today's challenge."}</p>
        ) : (
          <>
            <p className="font-mono text-xs font-bold uppercase tracking-wide text-text-dim">
              {daily.topic.shortName} · {difficultyLabel(daily.difficulty)}
            </p>
            <p className="text-lg font-medium leading-snug text-text">{daily.challenge.question}</p>
            <span className="flex items-center gap-1.5 self-start rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-accent-contrast">
              {playLabel}
              <ArrowRight size={16} aria-hidden />
            </span>
          </>
        )}
      </button>

      <div className="mb-8">
        <p className="mb-3 text-sm font-semibold text-text-dim">Choose difficulty</p>
        <DifficultyPicker value={difficulty} onChange={handleDifficulty} disabled={changingDifficulty} />
      </div>

      <div className="mb-10">
        <p className="mb-3 text-sm font-semibold text-text-dim">Your topics</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {topics.map((topic) => (
            <TopicChip
              key={topic.id}
              topic={topic}
              completed={daily?.completedTopicIds.includes(topic.id) ?? false}
              onClick={() => navigate(`/play/practice/${topic.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
