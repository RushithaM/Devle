import { Delete } from "lucide-react";
import type { KeyboardState, LetterStatus } from "../engine/types";

interface KeyboardProps {
  keyboardState: KeyboardState;
  onKey: (letter: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  disabled: boolean;
}

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

const STATUS_CLASS: Record<LetterStatus, string> = {
  correct: "bg-correct text-correct-contrast",
  present: "bg-present text-present-contrast",
  absent: "bg-absent text-absent-contrast",
};

export function Keyboard({ keyboardState, onKey, onEnter, onBackspace, disabled }: KeyboardProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-1.5" aria-label="On-screen keyboard">
      {ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1.5">
          {row.map((key) => {
            if (key === "ENTER") {
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={onEnter}
                  aria-label="Submit guess"
                  className="flex h-12 flex-[1.6] items-center justify-center rounded-md bg-surface-2 text-xs font-bold text-text transition active:scale-95 disabled:opacity-40 sm:text-sm"
                >
                  ENTER
                </button>
              );
            }
            if (key === "BACKSPACE") {
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={onBackspace}
                  aria-label="Delete letter"
                  className="flex h-12 flex-[1.6] items-center justify-center rounded-md bg-surface-2 text-text transition active:scale-95 disabled:opacity-40"
                >
                  <Delete size={18} aria-hidden />
                </button>
              );
            }
            const status = keyboardState[key];
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => onKey(key)}
                aria-label={key}
                className={`flex h-12 flex-1 items-center justify-center rounded-md font-mono text-sm font-semibold transition active:scale-95 disabled:opacity-40 sm:text-base ${
                  status ? STATUS_CLASS[status] : "bg-surface-2 text-text"
                }`}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
