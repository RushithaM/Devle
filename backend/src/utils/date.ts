/**
 * The backend's single source of truth for "what day is it" — always UTC,
 * never the host machine's local timezone or the client's clock. Every
 * daily-challenge and streak calculation goes through these so the answer
 * doesn't depend on where the server happens to be deployed.
 */

const EPOCH_UTC = Date.UTC(2024, 0, 1);
const MS_PER_DAY = 86_400_000;

export function dateKeyUTC(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Midnight UTC of the given date's UTC calendar day — safe to store in a `@db.Date` column. */
export function toUtcDateOnly(date: Date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/** Day 1 is 2024-01-01 UTC. Used to deterministically rotate the daily-featured topic. */
export function dayNumberUTC(date: Date = new Date()): number {
  const utcDate = toUtcDateOnly(date).getTime();
  return Math.floor((utcDate - EPOCH_UTC) / MS_PER_DAY) + 1;
}

export function addDaysToDateKey(dateKey: string, delta: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year!, month! - 1, day! + delta));
  return dateKeyUTC(shifted);
}

export function parseDateKeyUTC(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!));
}
