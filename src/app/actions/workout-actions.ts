"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  WorkoutSession,
  ExerciseEntry,
  ExerciseDefinition,
  WorkoutTemplate,
} from "@/types/database";

export type SessionWithEntries = WorkoutSession & { exercise_entries: ExerciseEntry[] };

export type TemplateWithExercises = WorkoutTemplate & {
  workout_template_exercises: ({
    id: string;
    template_id: string;
    exercise_definition_id: string;
    sort_order: number;
    exercise_definitions: ExerciseDefinition | null;
  })[];
};

export type SessionExerciseInput = {
  exercise_definition_id: string;
  name: string;
  weight_kg?: number | null;
  sets?: number;
  reps?: number | null;
};

/** Create a session and add exercise entries with optional initial weight/sets/reps. */
export async function createSessionWithExercises(
  sessionDate: string,
  sessionName: string | null,
  exercises: SessionExerciseInput[]
): Promise<{ ok: true; session: SessionWithEntries } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: session, error: sessionError } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      session_date: sessionDate,
      name: sessionName?.trim() || null,
    })
    .select()
    .single();

  if (sessionError || !session) return { ok: false, error: sessionError?.message ?? "Failed to create session" };

  if (exercises.length === 0) {
    return { ok: true, session: { ...session, exercise_entries: [] } };
  }

  const entries: ExerciseEntry[] = [];
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const { data: entry, error: entryError } = await supabase
      .from("exercise_entries")
      .insert({
        session_id: session.id,
        exercise_definition_id: ex.exercise_definition_id,
        name: ex.name,
        sets: ex.sets ?? 0,
        reps: ex.reps ?? null,
        weight_kg: ex.weight_kg ?? null,
        sort_order: i,
      })
      .select()
      .single();
    if (!entryError && entry) entries.push(entry);
  }

  return { ok: true, session: { ...session, exercise_entries: entries } };
}

/** Latest and max weight per exercise_definition_id for the current user. */
export async function getExerciseDefinitionStats(): Promise<
  Record<string, { latestWeight: number | null; maxWeight: number | null }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", user.id);
  const sessionIds = (sessions ?? []).map((s) => s.id);
  if (sessionIds.length === 0) return {};

  const { data: rows } = await supabase
    .from("exercise_entries")
    .select("session_id, exercise_definition_id, weight_kg, created_at")
    .not("exercise_definition_id", "is", null)
    .in("session_id", sessionIds);

  const filtered = rows ?? [];
  const byDef: Record<string, { weight_kg: number | null; created_at: string }[]> = {};
  for (const r of filtered) {
    const id = r.exercise_definition_id as string;
    if (!byDef[id]) byDef[id] = [];
    byDef[id].push({ weight_kg: r.weight_kg, created_at: r.created_at });
  }

  const result: Record<string, { latestWeight: number | null; maxWeight: number | null }> = {};
  for (const [id, arr] of Object.entries(byDef)) {
    const withDate = arr.filter((a) => a.weight_kg != null) as { weight_kg: number; created_at: string }[];
    const sorted = [...withDate].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const latestWeight = sorted[0]?.weight_kg ?? null;
    const maxWeight = withDate.length ? Math.max(...withDate.map((a) => a.weight_kg)) : null;
    result[id] = { latestWeight, maxWeight };
  }
  return result;
}

/** Create a new exercise definition. */
export async function createExerciseDefinition(
  name: string,
  muscleGroup: string | null
): Promise<{ ok: true; data: ExerciseDefinition } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data, error } = await supabase
    .from("exercise_definitions")
    .insert({
      user_id: user.id,
      name: name.trim(),
      muscle_group: muscleGroup?.trim() || null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Failed to create" };
  return { ok: true, data: data as ExerciseDefinition };
}

/** Update a single exercise entry (sets, reps, weight_kg, notes). */
export async function updateExerciseEntry(
  entryId: string,
  updates: { sets?: number; reps?: number | null; weight_kg?: number | null; notes?: string | null }
): Promise<{ ok: true; data: ExerciseEntry } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercise_entries")
    .update(updates)
    .eq("id", entryId)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Not found" };
  return { ok: true, data: data as ExerciseEntry };
}

/** Create a workout template with the given name and exercise definition IDs. */
export async function createWorkoutTemplate(
  name: string,
  exerciseDefinitionIds: string[]
): Promise<{ ok: true; template: TemplateWithExercises } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: template, error: templateError } = await supabase
    .from("workout_templates")
    .insert({ user_id: user.id, name: name.trim() })
    .select()
    .single();

  if (templateError || !template) return { ok: false, error: templateError?.message ?? "Failed to create template" };

  const templateExercises: TemplateWithExercises["workout_template_exercises"] = [];
  for (let i = 0; i < exerciseDefinitionIds.length; i++) {
    const defId = exerciseDefinitionIds[i];
    const { data: def } = await supabase
      .from("exercise_definitions")
      .select()
      .eq("id", defId)
      .single();
    const { data: te, error: teError } = await supabase
      .from("workout_template_exercises")
      .insert({
        template_id: template.id,
        exercise_definition_id: defId,
        sort_order: i,
      })
      .select()
      .single();
    if (!teError && te)
      templateExercises.push({
        ...te,
        exercise_definitions: def as ExerciseDefinition | null,
      });
  }
  return {
    ok: true,
    template: { ...template, workout_template_exercises: templateExercises } as TemplateWithExercises,
  };
}

/** Add one exercise entry to a session (by definition id or free name). */
export async function addExerciseToSession(
  sessionId: string,
  exerciseDefinitionId: string | null,
  name: string
): Promise<{ ok: true; data: ExerciseEntry } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("exercise_entries")
    .select("sort_order")
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = (existing?.sort_order ?? -1) + 1;
  const { data, error } = await supabase
    .from("exercise_entries")
    .insert({
      session_id: sessionId,
      exercise_definition_id: exerciseDefinitionId,
      name: name.trim() || "Exercise",
      sets: 0,
      sort_order: sortOrder,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Failed to add" };
  return { ok: true, data: data as ExerciseEntry };
}
