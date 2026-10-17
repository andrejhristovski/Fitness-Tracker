import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db";
import type { MaxLog } from "@/app/actions/workout-actions";

const { exerciseEntries, workoutSessions } = schema;

/** Heaviest weight per exercise per date (oldest first), keyed by exercise definition id. */
export async function fetchExerciseHistory(userId: string): Promise<Record<string, MaxLog[]>> {
  const rows = await db
    .select({
      definitionId: exerciseEntries.exercise_definition_id,
      kg: exerciseEntries.weight_kg,
      date: workoutSessions.session_date,
    })
    .from(exerciseEntries)
    .innerJoin(workoutSessions, eq(exerciseEntries.session_id, workoutSessions.id))
    .where(
      and(
        eq(exerciseEntries.user_id, userId),
        isNotNull(exerciseEntries.exercise_definition_id),
        isNotNull(exerciseEntries.weight_kg)
      )
    );

  const maxes: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    const byDate = (maxes[r.definitionId!] ??= {});
    byDate[r.date] = Math.max(byDate[r.date] ?? 0, r.kg!);
  }

  const history: Record<string, MaxLog[]> = {};
  for (const [id, byDate] of Object.entries(maxes)) {
    history[id] = Object.entries(byDate)
      .map(([date, kg]) => ({ date, kg }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  return history;
}
