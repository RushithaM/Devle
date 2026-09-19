import { useState } from "react";
import { BookOpen, Check, Lightbulb, Share2 } from "lucide-react";
import type { GuessResult } from "../engine/types";
import { buildShareText, shareOrCopy } from "../lib/shareText";
import { StreakBadge } from "./StreakBadge";

interface ResultChallenge {
  answer: string;
  explanation: string;
  relatedConcepts: string[];
  interviewTip?: string | null;
}

interface ResultScreenProps {
  challenge: ResultChallenge;
  results: GuessResult[];
  maxAttempts: number;
  won: boolean;
  hintsUsed: 0 | 1 | 2;
  streak?: number;
  dayNumber?: number;
  topicShortName: string;
  onDone: () => void;
}

export function ResultScreen({
  challenge,
  results,
  maxAttempts,
  won,
  hintsUsed,
  streak,
  dayNumber,
  topicShortName,
  onDone,
}: ResultScreenProps) {
  const [shareStatus, setShareStatus] = useState<"idle" | "shared" | "copied">("idle");

  const handleShare = async () => {
    const text = buildShareText({
      topicShortName,
      dayNumber: dayNumber ?? 0,
      results,
      maxAttempts,
      won,
    });
    const outcome = await shareOrCopy(text);
    if (outcome === "shared" || outcome === "copied") {
      setShareStatus(outcome);
      window.setTimeout(() => setShareStatus("idle"), 2000);
    }
  };

  return (
    <div className="animate-rise mx-auto flex w-full max-w-md flex-col gap-6 pb-10">
      <div className="text-center">
        <p className="text-lg font-semibold text-text">
          {won ? "🎉 Solved!" : "The answer was:"}
        </p>
        <p className="mt-2 font-mono text-4xl font-extrabold tracking-wide text-text">
          {challenge.answer}
        </p>
      </div>

      <div className="flex justify-center gap-8 font-mono text-sm text-text-dim">
        <div className="text-center">
          <div className="text-xl font-bold text-text">
            {won ? results.length : "X"}/{maxAttempts}
          </div>
          <div>attempts</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-text">{hintsUsed}/2</div>
          <div>hints</div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="flex items-center gap-2 font-semibold text-text">
          <BookOpen size={16} className="text-accent" aria-hidden />
          What is {/^[aeiou]/i.test(challenge.answer) ? "an" : "a"} {challenge.answer.toLowerCase()}?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-text-dim">{challenge.explanation}</p>

        {challenge.relatedConcepts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {challenge.relatedConcepts.map((concept) => (
              <span
                key={concept}
                className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-dim"
              >
                {concept}
              </span>
            ))}
          </div>
        )}

        {challenge.interviewTip && (
          <p className="mt-3 flex items-start gap-2 rounded-md bg-surface-2 px-3 py-2 text-sm text-text">
            <Lightbulb size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            <span>
              <span className="font-semibold">Interview tip: </span>
              {challenge.interviewTip}
            </span>
          </p>
        )}
      </div>

      {typeof streak === "number" && (
        <div className="flex justify-center">
          <StreakBadge streak={streak} />
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleShare}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm font-semibold text-text transition hover:border-accent"
        >
          {shareStatus === "idle" ? (
            <>
              <Share2 size={16} aria-hidden /> Share result
            </>
          ) : (
            <>
              <Check size={16} aria-hidden /> {shareStatus === "shared" ? "Shared" : "Copied"}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-lg bg-accent py-3 text-sm font-bold text-accent-contrast transition active:scale-[0.98]"
        >
          Done
        </button>
      </div>
    </div>
  );
}
