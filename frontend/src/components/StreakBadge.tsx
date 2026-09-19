interface StreakBadgeProps {
  streak: number;
  size?: "md" | "lg";
}

export function StreakBadge({ streak, size = "md" }: StreakBadgeProps) {
  const textSize = size === "lg" ? "text-4xl" : "text-lg";

  return (
    <div
      className="inline-flex items-center gap-2 font-mono font-bold text-text"
      aria-label={`${streak} day streak`}
    >
      <span className={textSize} aria-hidden>
        🔥
      </span>
      <span className={textSize}>{streak}</span>
      {size === "lg" && <span className="text-sm font-medium text-text-dim">day streak</span>}
    </div>
  );
}
