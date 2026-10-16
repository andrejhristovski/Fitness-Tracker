"use server";

import { createClient } from "@/lib/supabase/server";
import type { ExerciseDefinition } from "@/types/database";

/** All daily maxes are stored as exercise entries in one session per day with this name. */
const DAILY_SESSION_NAME = "Daily log";

/** One point in an exercise's history: the heaviest weight logged on a date. */
export type MaxLog = { date: string; kg: number };

/** A workout day in the user's split (stored as a workout template). */
export type DayPlan = { id: string; name: string; exerciseIds: string[] };

type ExerciseInput = { name: string; muscle_group: string | null };
type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Save any exercises the user doesn't have yet; returns the new rows and the id for every item, in order. */
async function ensureDefinitions(supabase: Supabase, userId: string, items: ExerciseInput[]) {
  const { data: existing } = await supabase
    .from("exercise_definitions")
    .select("id, name")
    .eq("user_id", userId);
  const idByName = new Map((existing ?? []).map((d) => [d.name.toLowerCase(), d.id as string]));

  const cleaned = items
    .map((i) => ({ name: i.name.trim(), muscle_group: i.muscle_group?.trim() || null }))
    .filter((i) => i.name);
  const missing = cleaned.filter(
    (i, idx) =>
      !idByName.has(i.name.toLowerCase()) &&
      cleaned.findIndex((j) => j.name.toLowerCase() === i.name.toLowerCase()) === idx
  );

  let created: ExerciseDefinition[] = [];
  if (missing.length > 0) {
    const { data, error } = await supabase
      .from("exercise_definitions")
      .insert(missing.map((i) => ({ ...i, user_id: userId })))
      .select();
    if (error) return { error: error.message };
    created = (data ?? []) as ExerciseDefinition[];
    for (const d of created) idByName.set(d.name.toLowerCase(), d.id);
  }

  const ids = [...new Set(cleaned.map((i) => idByName.get(i.name.toLowerCase())!).filter(Boolean))];
  return { created, ids };
}

/** Append exercises to a day (skips ones already in it); returns the day's full ordered list. */
async function appendToPlan(supabase: Supabase, planId: string, ids: string[]) {
  const { data: rows } = await supabase
    .from("workout_template_exercises")
    .select("exercise_definition_id, sort_order")
    .eq("template_id", planId)
    .order("sort_order");
  const current = (rows ?? []).map((r) => r.exercise_definition_id as string);
  const toAdd = ids.filter((id) => !current.includes(id));
  if (toAdd.length > 0) {
    const start = (rows ?? []).reduce((m, r) => Math.max(m, r.sort_order + 1), 0);
    const { error } = await supabase.from("workout_template_exercises").insert(
      toAdd.map((id, i) => ({ template_id: planId, exercise_definition_id: id, sort_order: start + i }))
    );
    if (error) return { error: error.message };
  }
  return { exerciseIds: [...current, ...toAdd] };
}

/** Add exercises to the user's list (skips names already saved), optionally also to a day. */
export async function addExercises(
  items: ExerciseInput[],
  planId: string | null
): Promise<
  { ok: true; created: ExerciseDefinition[]; planExerciseIds: string[] | null } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const ensured = await ensureDefinitions(supabase, user.id, items);
  if ("error" in ensured) return { ok: false, error: ensured.error! };
  if (!planId) return { ok: true, created: ensured.created, planExerciseIds: null };

  const appended = await appendToPlan(supabase, planId, ensured.ids);
  if ("error" in appended) return { ok: false, error: appended.error! };
  return { ok: true, created: ensured.created, planExerciseIds: appended.exerciseIds };
}

/**
 * Create one or more workout days, saving any of their exercises the user doesn't have yet.
 * Done in a single action so the client never has to chain server-action calls.
 */
export async function createDayPlans(
  days: { name: string; items: ExerciseInput[] }[]
): Promise<{ ok: true; plans: DayPlan[]; created: ExerciseDefinition[] } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const plans: DayPlan[] = [];
  const created: ExerciseDefinition[] = [];
  for (const day of days) {
    const ensured = await ensureDefinitions(supabase, user.id, day.items);
    if ("error" in ensured) return { ok: false, error: ensured.error! };
    created.push(...ensured.created);

    const { data: template, error } = await supabase
      .from("workout_templates")
      .insert({ user_id: user.id, name: day.name.trim() })
      .select("id, name")
      .single();
    if (error || !template) return { ok: false, error: error?.message ?? "Failed to create day" };

    const appended = await appendToPlan(supabase, template.id, ensured.ids);
    if ("error" in appended) return { ok: false, error: appended.error! };
    plans.push({ id: template.id, name: template.name, exerciseIds: appended.exerciseIds });
  }
  return { ok: true, plans, created };
}

/** Rename a day and replace its exercise list (in the given order). */
export async function updateDayPlan(
  id: string,
  name: string,
  exerciseIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("workout_templates").update({ name: name.trim() }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  const { error: delError } = await supabase.from("workout_template_exercises").delete().eq("template_id", id);
  if (delError) return { ok: false, error: delError.message };
  if (exerciseIds.length > 0) {
    const { error: insError } = await supabase.from("workout_template_exercises").insert(
      exerciseIds.map((exId, i) => ({ template_id: id, exercise_definition_id: exId, sort_order: i }))
    );
    if (insError) return { ok: false, error: insError.message };
  }
  return { ok: true };
}

/** Delete a workout day. Its exercises and their history stay. */
export async function deleteDayPlan(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("workout_templates").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Remove an exercise from the user's list. Past entries keep their name but lose the link. */
export async function deleteExerciseDefinition(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("exercise_definitions").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Set (or clear, with kg = null) the max weight for an exercise on a date.
 * Stored in that day's "Daily log" session so the stats tab still counts the workout.
 */
export async function logDailyMax(
  definition: { id: string; name: string },
  date: string,
  kg: number | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: found } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", user.id)
    .eq("session_date", date)
    .eq("name", DAILY_SESSION_NAME)
    .limit(1)
    .maybeSingle();

  let sessionId = found?.id as string | undefined;
  if (!sessionId) {
    if (kg == null) return { ok: true };
    const { data: created, error } = await supabase
      .from("workout_sessions")
      .insert({ user_id: user.id, session_date: date, name: DAILY_SESSION_NAME })
      .select("id")
      .single();
    if (error || !created) return { ok: false, error: error?.message ?? "Failed to create session" };
    sessionId = created.id as string;
  }

  const { data: entry } = await supabase
    .from("exercise_entries")
    .select("id")
    .eq("session_id", sessionId)
    .eq("exercise_definition_id", definition.id)
    .limit(1)
    .maybeSingle();

  if (kg == null) {
    if (entry) await supabase.from("exercise_entries").delete().eq("id", entry.id);
    const { count } = await supabase
      .from("exercise_entries")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId);
    if (!count) await supabase.from("workout_sessions").delete().eq("id", sessionId);
    return { ok: true };
  }

  const { error } = entry
    ? await supabase.from("exercise_entries").update({ weight_kg: kg }).eq("id", entry.id)
    : await supabase.from("exercise_entries").insert({
        session_id: sessionId,
        exercise_definition_id: definition.id,
        name: definition.name,
        sets: 1,
        weight_kg: kg,
      });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
