import { formatDateKey } from "./date";

/** Day 1 of the daily challenge numbering shown in shared results, e.g. "DSA #42". */
const EPOCH_UTC = Date.UTC(2024, 0, 1);
const MS_PER_DAY = 86_400_000;

/** The sequential day number used for display, e.g. "DSA #42". Day 1 is 2024-01-01. */
export function getDayNumber(date: Date): number {
  const [year, month, day] = formatDateKey(date).split("-").map(Number);
  const utcDate = Date.UTC(year!, month! - 1, day!);
  return Math.floor((utcDate - EPOCH_UTC) / MS_PER_DAY) + 1;
}

/** FNV-1a 32-bit hash: fast, dependency-free, and stable across runs/platforms. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Deterministically maps a seed string to an index in [0, poolSize). Used so
 * "same seed in -> same index out" everywhere a daily selection is made,
 * whether that's client-side preview logic or the backend's source-of-truth
 * daily challenge lookup — same algorithm, no drift.
 */
export function pickDeterministicIndex(seed: string, poolSize: number): number {
  if (poolSize <= 0) {
    throw new Error("poolSize must be greater than 0");
  }
  return hashString(seed) % poolSize;
}
