"use server";

import { and, asc, count, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { withUser } from "@/lib/action-result";
import type { ExerciseDefinition } from "@/types/database";

const { exerciseDefinitions, workoutTemplates, workoutTemplateExercises, workoutSessions, exerciseEntries } = schema;

/** All daily maxes are stored as exercise entries in one session per day with this name. */
const DAILY_SESSION_NAME = "Daily log";

/** One point in an exercise's history: the heaviest weight logged on a date. */
export type MaxLog = { date: string; kg: number };

/** A workout day in the user's split (stored as a workout template). */
export type DayPlan = { id: string; name: string; exerciseIds: string[] };

type ExerciseInput = { name: string; muscle_group: string | null };

/** Save any exercises the user doesn't have yet; returns the new rows and the id for every item, in order. */
async function ensureDefinitions(userId: string, items: ExerciseInput[]) {
  const existing = await db
    .select({ id: exerciseDefinitions.id, name: exerciseDefinitions.name })
    .from(exerciseDefinitions)
    .where(eq(exerciseDefinitions.user_id, userId));
  const idByName = new Map(existing.map((d) => [d.name.toLowerCase(), d.id]));

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
    created = await db
      .insert(exerciseDefinitions)
      .values(missing.map((i) => ({ ...i, user_id: userId })))
      .returning();
    for (const d of created) idByName.set(d.name.toLowerCase(), d.id);
  }

  const ids = [...new Set(cleaned.map((i) => idByName.get(i.name.toLowerCase())!).filter(Boolean))];
  return { created, ids };
}

/** Append exercises to a day (skips ones already in it); returns the day's full ordered list. */
async function appendToPlan(userId: string, planId: string, ids: string[]) {
  const rows = await db
    .select({ id: workoutTemplateExercises.exercise_definition_id, sort: workoutTemplateExercises.sort_order })
    .from(workoutTemplateExercises)
    .where(and(eq(workoutTemplateExercises.template_id, planId), eq(workoutTemplateExercises.user_id, userId)))
    .orderBy(asc(workoutTemplateExercises.sort_order));
  const current = rows.map((r) => r.id);
  const toAdd = ids.filter((id) => !current.includes(id));
  if (toAdd.length > 0) {
    const start = rows.reduce((m, r) => Math.max(m, r.sort + 1), 0);
    await db.insert(workoutTemplateExercises).values(
      toAdd.map((id, i) => ({ user_id: userId, template_id: planId, exercise_definition_id: id, sort_order: start + i }))
    );
  }
  return [...current, ...toAdd];
}

async function ownsTemplate(userId: string, planId: string) {
  const [row] = await db
    .select({ id: workoutTemplates.id })
    .from(workoutTemplates)
    .where(and(eq(workoutTemplates.id, planId), eq(workoutTemplates.user_id, userId)));
  return !!row;
}

/** Add exercises to the user's list (skips names already saved), optionally also to a day. */
export async function addExercises(items: ExerciseInput[], planId: string | null) {
  return withUser(async (userId) => {
    if (planId && !(await ownsTemplate(userId, planId))) return { ok: false as const, error: "Day not found" };
    const { created, ids } = await ensureDefinitions(userId, items);
    const planExerciseIds = planId ? await appendToPlan(userId, planId, ids) : null;
    return { ok: true as const, created, planExerciseIds };
  });
}

/** Create one or more workout days, saving any of their exercises the user doesn't have yet. */
export async function createDayPlans(days: { name: string; items: ExerciseInput[] }[]) {
  return withUser(async (userId) => {
    const plans: DayPlan[] = [];
    const created: ExerciseDefinition[] = [];
    for (const day of days) {
      const ensured = await ensureDefinitions(userId, day.items);
      created.push(...ensured.created);
      const [template] = await db
        .insert(workoutTemplates)
        .values({ user_id: userId, name: day.name.trim() })
        .returning({ id: workoutTemplates.id, name: workoutTemplates.name });
      const exerciseIds = await appendToPlan(userId, template.id, ensured.ids);
      plans.push({ id: template.id, name: template.name, exerciseIds });
    }
    return { ok: true as const, plans, created };
  });
}

/** Rename a day and replace its exercise list (in the given order). */
export async function updateDayPlan(id: string, name: string, exerciseIds: string[]) {
  return withUser(async (userId) => {
    if (!(await ownsTemplate(userId, id))) return { ok: false as const, error: "Day not found" };
    // Only link exercises that belong to this user.
    const valid =
      exerciseIds.length === 0
        ? []
        : (
            await db
              .select({ id: exerciseDefinitions.id })
              .from(exerciseDefinitions)
              .where(and(eq(exerciseDefinitions.user_id, userId), inArray(exerciseDefinitions.id, exerciseIds)))
          ).map((r) => r.id);
    const ordered = exerciseIds.filter((x) => valid.includes(x));

    await db.transaction(async (tx) => {
      await tx.update(workoutTemplates).set({ name: name.trim() }).where(eq(workoutTemplates.id, id));
      await tx.delete(workoutTemplateExercises).where(eq(workoutTemplateExercises.template_id, id));
      if (ordered.length > 0) {
        await tx.insert(workoutTemplateExercises).values(
          ordered.map((exId, i) => ({ user_id: userId, template_id: id, exercise_definition_id: exId, sort_order: i }))
        );
      }
    });
    return { ok: true as const };
  });
}

/** Delete a workout day. Its exercises and their history stay. */
export async function deleteDayPlan(id: string) {
  return withUser(async (userId) => {
    await db.delete(workoutTemplates).where(and(eq(workoutTemplates.id, id), eq(workoutTemplates.user_id, userId)));
    return { ok: true as const };
  });
}

/** Remove an exercise from the user's list. Past entries keep their name but lose the link. */
export async function deleteExerciseDefinition(id: string) {
  return withUser(async (userId) => {
    await db
      .delete(exerciseDefinitions)
      .where(and(eq(exerciseDefinitions.id, id), eq(exerciseDefinitions.user_id, userId)));
    return { ok: true as const };
  });
}

/**
 * Set (or clear, with kg = null) the max weight for an exercise on a date.
 * Stored in that day's "Daily log" session so the stats tab still counts the workout.
 */
export async function logDailyMax(definition: { id: string; name: string }, date: string, kg: number | null) {
  return withUser(async (userId) => {
    const [owned] = await db
      .select({ id: exerciseDefinitions.id, name: exerciseDefinitions.name })
      .from(exerciseDefinitions)
      .where(and(eq(exerciseDefinitions.id, definition.id), eq(exerciseDefinitions.user_id, userId)));
    if (!owned) return { ok: false as const, error: "Exercise not found" };

    const [found] = await db
      .select({ id: workoutSessions.id })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.user_id, userId),
          eq(workoutSessions.session_date, date),
          eq(workoutSessions.name, DAILY_SESSION_NAME)
        )
      )
      .limit(1);

    let sessionId = found?.id;
    if (!sessionId) {
      if (kg == null) return { ok: true as const };
      const [created] = await db
        .insert(workoutSessions)
        .values({ user_id: userId, session_date: date, name: DAILY_SESSION_NAME })
        .returning({ id: workoutSessions.id });
      sessionId = created.id;
    }

    const [entry] = await db
      .select({ id: exerciseEntries.id })
      .from(exerciseEntries)
      .where(and(eq(exerciseEntries.session_id, sessionId), eq(exerciseEntries.exercise_definition_id, owned.id)))
      .limit(1);

    if (kg == null) {
      if (entry) await db.delete(exerciseEntries).where(eq(exerciseEntries.id, entry.id));
      const [{ n }] = await db.select({ n: count() }).from(exerciseEntries).where(eq(exerciseEntries.session_id, sessionId));
      if (!n) await db.delete(workoutSessions).where(eq(workoutSessions.id, sessionId));
      return { ok: true as const };
    }

    if (entry) {
      await db.update(exerciseEntries).set({ weight_kg: kg }).where(eq(exerciseEntries.id, entry.id));
    } else {
      await db.insert(exerciseEntries).values({
        user_id: userId,
        session_id: sessionId,
        exercise_definition_id: owned.id,
        name: owned.name,
        sets: 1,
        weight_kg: kg,
      });
    }
    return { ok: true as const };
  });
}
