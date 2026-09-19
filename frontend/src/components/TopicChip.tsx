import { Check } from "lucide-react";

interface TopicChipProps {
  topic: {
    id: string;
    shortName: string;
    description: string;
  };
  onClick: () => void;
  completed?: boolean;
}

export function TopicChip({ topic, onClick, completed = false }: TopicChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={completed ? `${topic.shortName}, completed today` : topic.shortName}
      className={`rounded-lg border-2 bg-surface px-4 py-3 text-left transition hover:-translate-y-0.5 active:translate-y-0 ${
        completed ? "border-correct" : "border-border hover:border-accent"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-sm font-bold text-text">{topic.shortName}</div>
        {completed && <Check size={14} strokeWidth={2.5} className="shrink-0 text-correct" aria-hidden />}
      </div>
      <div className="mt-0.5 text-xs text-text-dim">{topic.description}</div>
    </button>
  );
}
