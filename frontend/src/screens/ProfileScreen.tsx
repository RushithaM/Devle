import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Difficulty } from "../api/types";
import { DifficultyPicker } from "../components/DifficultyPicker";
import { Header } from "../components/Header";
import { useAppData } from "../state/AppDataContext";
import { useAuth } from "../state/AuthContext";

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <span className="text-sm text-text-dim">{label}</span>
      <span className="font-mono text-base font-bold text-text">{value}</span>
    </div>
  );
}

export function ProfileScreen() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const {
    profileName,
    profileEmail,
    streak,
    bestStreak,
    stats,
    winRate,
    difficulty,
    setDifficulty,
  } = useAppData();
  const [loggingOut, setLoggingOut] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleDifficulty = async (next: Difficulty) => {
    if (next === difficulty) return;
    setSaving(true);
    try {
      await setDifficulty(next);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">
      <Header onBack={() => navigate("/")} />
      <h1 className="mb-6 mt-2 text-xl font-bold text-text">Profile</h1>

      <div className="mb-6 rounded-xl border border-border bg-surface px-5 py-4">
        <p className="text-lg font-semibold text-text">{profileName ?? "—"}</p>
        <p className="mt-1 text-sm text-text-dim">{profileEmail ?? "—"}</p>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-surface px-5">
        <StatRow label="Current streak" value={String(streak)} />
        <StatRow label="Best streak" value={String(bestStreak)} />
        <StatRow label="Games played" value={String(stats.gamesPlayed)} />
        <StatRow label="Win rate" value={`${Math.round(winRate * 100)}%`} />
      </div>

      <div className="mb-8">
        <p className="mb-3 text-sm font-semibold text-text-dim">Preferred difficulty</p>
        <DifficultyPicker value={difficulty} onChange={handleDifficulty} disabled={saving} />
      </div>

      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={loggingOut}
        className="rounded-lg border border-border py-3 text-sm font-semibold text-text transition hover:border-danger hover:text-danger disabled:opacity-60"
      >
        {loggingOut ? "Logging out…" : "Log out"}
      </button>
    </div>
  );
}
