import type { Difficulty } from "../api/types";

const OPTIONS: { id: Difficulty; label: string }[] = [
  { id: "EASY", label: "Easy" },
  { id: "MEDIUM", label: "Medium" },
  { id: "HARD", label: "Hard" },
];

interface DifficultyPickerProps {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
  disabled?: boolean;
}

export function DifficultyPicker({ value, onChange, disabled }: DifficultyPickerProps) {
  return (
    <div className="flex gap-2" role="group" aria-label="Choose difficulty">
      {OPTIONS.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              selected
                ? "bg-accent text-accent-contrast"
                : "border border-border bg-surface text-text-dim hover:border-accent hover:text-text"
            } disabled:opacity-50`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
