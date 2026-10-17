import { and, asc, eq, gte, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/session";
import { fetchExerciseHistory } from "@/lib/exercise-history";
import { goalsFromSettings } from "@/lib/nutrition-goals";
import { getUserToday } from "@/lib/user-date";
import { addDays } from "@/lib/dates";
import { StatsTab } from "@/components/stats/stats-tab";

const { foodEntries, bodyLogs, userSettings, workoutSessions, exerciseEntries, exerciseDefinitions } = schema;

export default async function StatsPage() {
  const user = await requireUser();
  // Enough history for the 90-day view plus the period before it.
  const since = addDays(await getUserToday(), -200);

  const [dailyFood, logs, [settings], trained, definitions, history] = await Promise.all([
    db
      .select({
        date: foodEntries.log_date,
        calories: sum(foodEntries.calories).mapWith(Number),
        protein: sum(foodEntries.protein).mapWith(Number),
        carbs: sum(foodEntries.carbs).mapWith(Number),
        fats: sum(foodEntries.fats).mapWith(Number),
      })
      .from(foodEntries)
      .where(and(eq(foodEntries.user_id, user.id), gte(foodEntries.log_date, since)))
      .groupBy(foodEntries.log_date),
    db.select().from(bodyLogs).where(eq(bodyLogs.user_id, user.id)).orderBy(asc(bodyLogs.log_date)),
    db.select().from(userSettings).where(eq(userSettings.user_id, user.id)),
    // A day counts as trained when it has a session with at least one exercise.
    db
      .selectDistinct({ date: workoutSessions.session_date })
      .from(workoutSessions)
      .innerJoin(exerciseEntries, eq(exerciseEntries.session_id, workoutSessions.id))
      .where(and(eq(workoutSessions.user_id, user.id), gte(workoutSessions.session_date, since))),
    db.select().from(exerciseDefinitions).where(eq(exerciseDefinitions.user_id, user.id)),
    fetchExerciseHistory(user.id),
  ]);

  const nutrition = Object.fromEntries(
    dailyFood.map(({ date, ...totals }) => [date, totals])
  );

  return (
    <StatsTab
      nutrition={nutrition}
      goals={goalsFromSettings(settings ?? null)}
      bodyLogs={logs}
      targetWeightKg={settings?.target_weight_kg ?? null}
      trainedDays={trained.map((t) => t.date)}
      definitions={definitions}
      history={history}
    />
  );
}
