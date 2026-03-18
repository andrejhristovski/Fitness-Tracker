import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getExerciseDefinitionStats } from "@/app/actions/workout-actions";
import { WorkoutsTab } from "@/components/workouts/workouts-tab";
import type { SessionWithEntries } from "@/app/actions/workout-actions";
import type { TemplateWithExercises } from "@/app/actions/workout-actions";
import type { ExerciseDefinition } from "@/types/database";

function WorkoutsFallback() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 animate-pulse rounded-lg bg-[var(--card)]" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--card)]" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-[var(--card)]" />
    </div>
  );
}

export default async function WorkoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    sessionsRes,
    templatesRes,
    definitionsRes,
    stats,
  ] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("*, exercise_entries(*)")
      .order("session_date", { ascending: false }),
    user
      ? supabase
          .from("workout_templates")
          .select("*, workout_template_exercises(*, exercise_definitions(*))")
          .eq("user_id", user.id)
          .order("name")
      : Promise.resolve({ data: [] }),
    user
      ? supabase
          .from("exercise_definitions")
          .select("*")
          .eq("user_id", user.id)
          .order("name")
      : Promise.resolve({ data: [] }),
    getExerciseDefinitionStats(),
  ]);

  const sessions: SessionWithEntries[] = (sessionsRes.data ?? []).map((s) => ({
    ...s,
    exercise_entries: (s.exercise_entries ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    ),
  }));

  const templates: TemplateWithExercises[] = (templatesRes.data ?? []).map((t) => ({
    ...t,
    workout_template_exercises: (t.workout_template_exercises ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    ),
  }));

  const definitions: ExerciseDefinition[] = (definitionsRes.data ?? []).map((d) => ({
    id: d.id,
    user_id: d.user_id,
    name: d.name,
    muscle_group: d.muscle_group,
    created_at: d.created_at,
  }));

  return (
    <Suspense fallback={<WorkoutsFallback />}>
      <WorkoutsTab
        initialSessions={sessions}
        templates={templates}
        definitions={definitions}
        definitionStats={stats}
      />
    </Suspense>
  );
}
