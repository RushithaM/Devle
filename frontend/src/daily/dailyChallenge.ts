import { challengeRepository } from "../content/repository";
import { TOPIC_IDS } from "../content/types";
import type { Challenge, TopicId } from "../content/types";
import { formatDateKey } from "../lib/date";

export { formatDateKey };

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
function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export interface DailyChallenge {
  challenge: Challenge;
  dayNumber: number;
  dateKey: string;
}

/**
 * Deterministically picks the daily challenge for a topic + date: the same
 * topic and calendar day always produce the same challenge, with no
 * uncontrolled randomness.
 */
export function getDailyChallenge(
  topic: TopicId,
  date: Date = new Date(),
): DailyChallenge {
  const pool = [...challengeRepository.getByTopic(topic)].sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  if (pool.length === 0) {
    throw new Error(`No challenges available for topic "${topic}"`);
  }

  const dateKey = formatDateKey(date);
  const index = hashString(`${topic}:${dateKey}`) % pool.length;

  return {
    challenge: pool[index]!,
    dayNumber: getDayNumber(date),
    dateKey,
  };
}

/**
 * The single topic featured as "today's Devle" on the home screen. Rotates
 * deterministically through every topic so the app always has one obvious
 * daily CTA instead of asking the user to pick a topic first.
 */
export function getFeaturedTopic(date: Date = new Date()): TopicId {
  const index = (getDayNumber(date) - 1) % TOPIC_IDS.length;
  return TOPIC_IDS[index]!;
}

export function getFeaturedDailyChallenge(date: Date = new Date()): DailyChallenge {
  return getDailyChallenge(getFeaturedTopic(date), date);
}
