/** Local calendar day as a stable "YYYY-MM-DD" key, independent of time of day. */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dateKey: string, delta: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year!, month! - 1, day!);
  date.setDate(date.getDate() + delta);
  return formatDateKey(date);
}
