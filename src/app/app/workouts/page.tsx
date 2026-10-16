import { createClient } from "@/lib/supabase/server";
import { fetchExerciseHistory } from "@/lib/exercise-history";
import { WorkoutsTab } from "@/components/workouts/workouts-tab";
import type { DayPlan } from "@/app/actions/workout-actions";
import type { ExerciseDefinition } from "@/types/database";

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [definitionsRes, history, plansRes] = await Promise.all([
    supabase.from("exercise_definitions").select("*").eq("user_id", user.id).order("created_at"),
    fetchExerciseHistory(supabase, user.id),
    supabase
      .from("workout_templates")
      .select("id, name, created_at, workout_template_exercises(exercise_definition_id, sort_order)")
      .eq("user_id", user.id)
      .order("created_at"),
  ]);

  const plans: DayPlan[] = (plansRes.data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    exerciseIds: [...(t.workout_template_exercises ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((e) => e.exercise_definition_id),
  }));

  return (
    <WorkoutsTab
      initialDefinitions={(definitionsRes.data ?? []) as ExerciseDefinition[]}
      initialHistory={history}
      initialPlans={plans}
    />
  );
}
