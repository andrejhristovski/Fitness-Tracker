"use server";

import { createClient } from "@/lib/supabase/server";
import { normalizeFood } from "@/lib/normalize-food";
import type { Food } from "@/types/database";

export type SaveFavoriteTemplateResult =
  | { ok: true; data: Food }
  | { ok: false; error: string };

export async function saveFavoriteFromTemplate(
  foodId: string,
  quickAddAmount: number,
  imagePath: string | null = null
): Promise<SaveFavoriteTemplateResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data, error } = await supabase
    .from("foods")
    .update({
      is_quick_add: true,
      quick_add_amount: quickAddAmount,
      image_path: imagePath ?? null,
    })
    .eq("id", foodId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Failed to save" };
  return { ok: true, data: normalizeFood(data) };
}

export type RemoveFavoriteResult =
  | { ok: true; data: Food }
  | { ok: false; error: string };

export async function removeFavorite(foodId: string): Promise<RemoveFavoriteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data, error } = await supabase
    .from("foods")
    .update({ is_quick_add: false })
    .eq("id", foodId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Failed to remove" };
  return { ok: true, data: normalizeFood(data) };
}
