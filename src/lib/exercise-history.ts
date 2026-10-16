import type { createClient } from "@/lib/supabase/server";
import type { MaxLog } from "@/app/actions/workout-actions";

type EntryRow = {
  exercise_definition_id: string;
  weight_kg: number;
  workout_sessions: { session_date: string } | { session_date: string }[] | null;
};

/** Heaviest weight per exercise per date (oldest first), keyed by exercise definition id. */
export async function fetchExerciseHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<Record<string, MaxLog[]>> {
  const { data } = await supabase
    .from("exercise_entries")
    .select("exercise_definition_id, weight_kg, workout_sessions!inner(session_date, user_id)")
    .eq("workout_sessions.user_id", userId)
    .not("exercise_definition_id", "is", null)
    .not("weight_kg", "is", null);

  const maxes: Record<string, Record<string, number>> = {};
  for (const row of (data ?? []) as unknown as EntryRow[]) {
    const session = Array.isArray(row.workout_sessions) ? row.workout_sessions[0] : row.workout_sessions;
    if (!session) continue;
    const byDate = (maxes[row.exercise_definition_id] ??= {});
    const kg = Number(row.weight_kg);
    byDate[session.session_date] = Math.max(byDate[session.session_date] ?? 0, kg);
  }

  const history: Record<string, MaxLog[]> = {};
  for (const [id, byDate] of Object.entries(maxes)) {
    history[id] = Object.entries(byDate)
      .map(([date, kg]) => ({ date, kg }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  return history;
}
