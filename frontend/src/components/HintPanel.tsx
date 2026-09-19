import { Lightbulb } from "lucide-react";

interface HintPanelProps {
  revealedHints: string[];
  onReveal: () => void;
  disabled: boolean;
}

export function HintPanel({ revealedHints, onReveal, disabled }: HintPanelProps) {
  const revealedCount = revealedHints.length;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
      {revealedHints.map((hint, i) => (
        <p
          key={i}
          className="animate-rise flex items-start gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-text"
        >
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
          <span>{hint}</span>
        </p>
      ))}
      {revealedCount < 2 && (
        <button
          type="button"
          onClick={onReveal}
          disabled={disabled}
          className="self-center rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-text-dim transition hover:border-accent hover:text-accent disabled:opacity-40"
        >
          {revealedCount === 0 ? "Use a hint (1 of 2)" : "Use another hint (2 of 2)"}
        </button>
      )}
    </div>
  );
}
