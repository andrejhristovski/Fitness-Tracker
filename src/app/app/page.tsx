import { and, asc, desc, eq, gte, lte, sum } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/session";
import { getUserToday } from "@/lib/user-date";
import { addDays, parseDate } from "@/lib/dates";
import { goalsFromSettings } from "@/lib/nutrition-goals";
import { fetchExerciseHistory } from "@/lib/exercise-history";
import { suggestDay } from "@/lib/workout-plan";
import { HomeView } from "@/components/home/home-view";

const { foodEntries, userSettings, bodyLogs, workoutSessions, exerciseEntries, workoutTemplates, workoutTemplateExercises } =
  schema;

export default async function HomePage() {
  const user = await requireUser();
  const today = await getUserToday();
  const weekStart = addDays(today, -((parseDate(today).getDay() + 6) % 7)); // Monday

  const [[food], [settings], [latestLog], trained, templates, links, history] = await Promise.all([
    db
      .select({
        calories: sum(foodEntries.calories).mapWith(Number),
        protein: sum(foodEntries.protein).mapWith(Number),
      })
      .from(foodEntries)
      .where(and(eq(foodEntries.user_id, user.id), eq(foodEntries.log_date, today))),
    db.select().from(userSettings).where(eq(userSettings.user_id, user.id)),
    db
      .select({ kg: bodyLogs.weight_kg })
      .from(bodyLogs)
      .where(eq(bodyLogs.user_id, user.id))
      .orderBy(desc(bodyLogs.log_date))
      .limit(1),
    db
      .selectDistinct({ date: workoutSessions.session_date })
      .from(workoutSessions)
      .innerJoin(exerciseEntries, eq(exerciseEntries.session_id, workoutSessions.id))
      .where(
        and(
          eq(workoutSessions.user_id, user.id),
          gte(workoutSessions.session_date, weekStart),
          lte(workoutSessions.session_date, today)
        )
      ),
    db
      .select({ id: workoutTemplates.id, name: workoutTemplates.name })
      .from(workoutTemplates)
      .where(eq(workoutTemplates.user_id, user.id))
      .orderBy(asc(workoutTemplates.created_at)),
    db
      .select({ templateId: workoutTemplateExercises.template_id, exerciseId: workoutTemplateExercises.exercise_definition_id })
      .from(workoutTemplateExercises)
      .where(eq(workoutTemplateExercises.user_id, user.id))
      .orderBy(asc(workoutTemplateExercises.sort_order)),
    fetchExerciseHistory(user.id),
  ]);

  const plans = templates.map((t) => ({
    id: t.id,
    name: t.name,
    exerciseIds: links.filter((l) => l.templateId === t.id).map((l) => l.exerciseId),
  }));
  const planId = suggestDay(plans, history, today);
  const plan = plans.find((p) => p.id === planId) ?? null;

  return (
    <HomeView
      name={user.name}
      today={today}
      weekStart={weekStart}
      goals={goalsFromSettings(settings ?? null)}
      eaten={{ calories: food?.calories ?? 0, protein: food?.protein ?? 0 }}
      weightKg={latestLog?.kg ?? settings?.current_weight_kg ?? null}
      trainedDays={trained.map((t) => t.date)}
      weeklyTarget={plans.length || 3}
      workout={
        plan && {
          name: plan.name,
          total: plan.exerciseIds.length,
          done: plan.exerciseIds.filter((id) => history[id]?.some((h) => h.date === today)).length,
        }
      }
    />
  );
}
