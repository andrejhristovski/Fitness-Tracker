"use server";

import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { withUser } from "@/lib/action-result";
import type { Food, FoodEntry } from "@/types/database";

const { foods, foodEntries } = schema;

export type NewFood = Omit<Food, "id" | "user_id" | "created_at">;

export type NewFoodEntry = Pick<
  FoodEntry,
  "food_id" | "name" | "calories" | "protein" | "carbs" | "fats" | "quantity" | "log_date" | "meal_type" | "image_path"
>;

export type FoodEntryUpdate = Partial<Pick<FoodEntry, "calories" | "protein" | "carbs" | "fats" | "quantity" | "meal_type">>;

/** Save a food type, or return the user's existing food with the same name (case-insensitive). */
export async function createFood(row: NewFood) {
  return withUser(async (userId) => {
    const name = row.name.trim();
    if (!name) return { ok: false as const, error: "Name is required" };
    const [existing] = await db
      .select()
      .from(foods)
      .where(and(eq(foods.user_id, userId), sql`lower(${foods.name}) = lower(${name})`));
    if (existing) return { ok: true as const, data: existing as Food, existed: true };
    const [created] = await db
      .insert(foods)
      .values({ ...row, name, user_id: userId })
      .returning();
    return { ok: true as const, data: created as Food, existed: false };
  });
}

/** Mark a food as a Quick add favorite with a default amount. */
export async function saveFavoriteFromTemplate(foodId: string, quickAddAmount: number, imagePath: string | null = null) {
  return withUser(async (userId) => {
    const [data] = await db
      .update(foods)
      .set({ is_quick_add: true, quick_add_amount: quickAddAmount, image_path: imagePath })
      .where(and(eq(foods.id, foodId), eq(foods.user_id, userId)))
      .returning();
    if (!data) return { ok: false as const, error: "Food not found" };
    return { ok: true as const, data: data as Food };
  });
}

export async function removeFavorite(foodId: string) {
  return withUser(async (userId) => {
    const [data] = await db
      .update(foods)
      .set({ is_quick_add: false })
      .where(and(eq(foods.id, foodId), eq(foods.user_id, userId)))
      .returning();
    if (!data) return { ok: false as const, error: "Food not found" };
    return { ok: true as const, data: data as Food };
  });
}

export async function addFoodEntry(entry: NewFoodEntry) {
  return withUser(async (userId) => {
    // Only link to a food the user owns.
    let foodId = entry.food_id;
    if (foodId) {
      const [owned] = await db
        .select({ id: foods.id })
        .from(foods)
        .where(and(eq(foods.id, foodId), eq(foods.user_id, userId)));
      foodId = owned?.id ?? null;
    }
    const [data] = await db
      .insert(foodEntries)
      .values({ ...entry, food_id: foodId, user_id: userId })
      .returning();
    return { ok: true as const, data: data as FoodEntry };
  });
}

export async function updateFoodEntry(id: string, update: FoodEntryUpdate) {
  return withUser(async (userId) => {
    const [data] = await db
      .update(foodEntries)
      .set(update)
      .where(and(eq(foodEntries.id, id), eq(foodEntries.user_id, userId)))
      .returning();
    if (!data) return { ok: false as const, error: "Entry not found" };
    return { ok: true as const, data: data as FoodEntry };
  });
}

export async function deleteFoodEntry(id: string) {
  return withUser(async (userId) => {
    await db.delete(foodEntries).where(and(eq(foodEntries.id, id), eq(foodEntries.user_id, userId)));
    return { ok: true as const };
  });
}
