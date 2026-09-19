import type { GuessResult, LetterStatus } from "../engine/types";

interface BoardProps {
  answerLength: number;
  maxAttempts: number;
  guesses: string[];
  results: GuessResult[];
  currentInput: string;
  invalidShake: boolean;
}

const STATUS_LABEL: Record<LetterStatus, string> = {
  correct: "correct",
  present: "wrong position",
  absent: "not in answer",
};

const STATUS_CLASS: Record<LetterStatus, string> = {
  correct: "bg-correct text-correct-contrast border-correct",
  present: "bg-present text-present-contrast border-present",
  absent: "bg-absent text-absent-contrast border-absent",
};

export function Board({
  answerLength,
  maxAttempts,
  guesses,
  results,
  currentInput,
  invalidShake,
}: BoardProps) {
  const rows = Array.from({ length: maxAttempts }, (_, r) => r);
  const activeRow = guesses.length;

  return (
    <div
      className="mx-auto flex flex-col gap-1.5 sm:gap-2"
      style={{
        containerType: "inline-size",
        width: `min(100%, ${answerLength * 3.4}rem)`,
      }}
      role="group"
      aria-label={`Guess board, ${maxAttempts} attempts of ${answerLength} letters each`}
    >
      {rows.map((r) => {
        const isSubmitted = r < guesses.length;
        const isActive = r === activeRow;
        const letters = isSubmitted
          ? guesses[r]!.split("")
          : isActive
            ? currentInput.padEnd(answerLength, " ").split("")
            : Array.from({ length: answerLength }, () => " ");

        return (
          <div
            key={r}
            className={`grid gap-1.5 sm:gap-2 ${isActive && invalidShake ? "animate-shake" : ""}`}
            style={{ gridTemplateColumns: `repeat(${answerLength}, minmax(0, 1fr))` }}
          >
            {letters.map((letter, i) => {
              const trimmed = letter.trim();
              const result = isSubmitted ? results[r]?.[i] : undefined;
              const filled = trimmed.length > 0;

              return (
                <div
                  key={i}
                  className={`flex aspect-square items-center justify-center rounded-md border-2 font-mono font-bold uppercase select-none ${
                    result
                      ? STATUS_CLASS[result.status]
                      : filled
                        ? "border-text-faint text-text"
                        : "border-border text-text"
                  } ${result ? "animate-flip" : filled ? "animate-pop" : ""}`}
                  style={{
                    fontSize: "clamp(0.85rem, 22cqi, 1.6rem)",
                    animationDelay: result ? `${i * 90}ms` : undefined,
                  }}
                  aria-label={
                    result
                      ? `${trimmed}, ${STATUS_LABEL[result.status]}`
                      : filled
                        ? trimmed
                        : "empty"
                  }
                >
                  {trimmed}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
