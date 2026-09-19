import type { GuessResult } from "../engine/types";

const EMOJI: Record<GuessResult[number]["status"], string> = {
  correct: "🟩",
  present: "🟨",
  absent: "⬜",
};

export function buildShareText(params: {
  topicShortName: string;
  dayNumber: number;
  results: GuessResult[];
  maxAttempts: number;
  won: boolean;
}): string {
  const { topicShortName, dayNumber, results, maxAttempts, won } = params;

  const grid = results
    .map((row) => row.map((r) => EMOJI[r.status]).join(""))
    .join("\n");

  const score = won ? `${results.length}/${maxAttempts}` : `X/${maxAttempts}`;

  return `DEVLE\n${topicShortName} #${dayNumber}\n\n${grid}\n\n${score}`;
}

export async function shareOrCopy(text: string): Promise<"shared" | "copied" | "failed"> {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch {
      // User cancelled or share failed — fall through to clipboard.
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
