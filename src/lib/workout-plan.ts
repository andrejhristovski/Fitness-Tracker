import type { DayPlan, MaxLog } from "@/app/actions/workout-actions";

/** Most recent date any exercise in the day was logged. */
export function lastTrained(plan: DayPlan, history: Record<string, MaxLog[]>): string | null {
  let last: string | null = null;
  for (const id of plan.exerciseIds) {
    const d = history[id]?.at(-1)?.date;
    if (d && (!last || d > last)) last = d;
  }
  return last;
}

/** Today's day if already started, otherwise the one after the most recently trained (rotation). */
export function suggestDay(plans: DayPlan[], history: Record<string, MaxLog[]>, today: string): string | null {
  if (plans.length === 0) return null;
  const last = plans.map((p) => lastTrained(p, history));
  const todayIdx = last.indexOf(today);
  if (todayIdx >= 0) return plans[todayIdx].id;
  let recent = -1;
  last.forEach((d, i) => {
    if (d && (recent < 0 || d > last[recent]!)) recent = i;
  });
  return plans[(recent + 1) % plans.length].id;
}
