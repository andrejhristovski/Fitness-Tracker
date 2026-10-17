import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/session";
import { fetchExerciseHistory } from "@/lib/exercise-history";
import { WorkoutsTab } from "@/components/workouts/workouts-tab";
import type { DayPlan } from "@/app/actions/workout-actions";

const { exerciseDefinitions, workoutTemplates, workoutTemplateExercises } = schema;

export default async function WorkoutsPage() {
  const user = await requireUser();

  const [definitions, history, templates, links] = await Promise.all([
    db
      .select()
      .from(exerciseDefinitions)
      .where(eq(exerciseDefinitions.user_id, user.id))
      .orderBy(asc(exerciseDefinitions.created_at)),
    fetchExerciseHistory(user.id),
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
  ]);

  const plans: DayPlan[] = templates.map((t) => ({
    id: t.id,
    name: t.name,
    exerciseIds: links.filter((l) => l.templateId === t.id).map((l) => l.exerciseId),
  }));

  return <WorkoutsTab initialDefinitions={definitions} initialHistory={history} initialPlans={plans} />;
}
