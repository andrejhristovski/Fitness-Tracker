"use server";

import { sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { withUser } from "@/lib/action-result";
import type { BodyLog, UserSettings } from "@/types/database";

const { userSettings, bodyLogs } = schema;

export type SettingsInput = Pick<
  UserSettings,
  "height_cm" | "current_weight_kg" | "target_weight_kg" | "calories_goal" | "protein_goal" | "carbs_goal" | "fats_goal"
>;

export async function saveSettings(input: SettingsInput) {
  return withUser(async (userId) => {
    await db
      .insert(userSettings)
      .values({ ...input, user_id: userId })
      .onConflictDoUpdate({ target: userSettings.user_id, set: { ...input, updated_at: sql`now()` } });
    return { ok: true as const };
  });
}

/** Add or replace the body weight log for a date. */
export async function saveBodyLog(input: { log_date: string; weight_kg: number | null; notes: string | null }) {
  return withUser(async (userId) => {
    const [data] = await db
      .insert(bodyLogs)
      .values({ ...input, user_id: userId })
      .onConflictDoUpdate({
        target: [bodyLogs.user_id, bodyLogs.log_date],
        set: { weight_kg: input.weight_kg, notes: input.notes },
      })
      .returning();
    return { ok: true as const, data: data as BodyLog };
  });
}
