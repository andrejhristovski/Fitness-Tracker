/** Date helpers working on local "YYYY-MM-DD" keys (the format Supabase DATE columns use). */

export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseDate(key: string) {
  return new Date(`${key}T00:00:00`);
}

export function addDays(key: string, days: number) {
  const d = parseDate(key);
  d.setDate(d.getDate() + days);
  return localDate(d);
}

/** The `count` date keys ending at (and including) `end`, oldest first. */
export function lastDays(end: string, count: number) {
  return Array.from({ length: count }, (_, i) => addDays(end, i - count + 1));
}

export function formatShortDate(key: string) {
  return parseDate(key).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function daysBetween(a: string, b: string) {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86_400_000);
}
