import type { Food } from "@/types/database";

/** Normalize a row from Supabase (or any partial) into a Food shape so it always has is_quick_add and quick_add_amount. */
export function normalizeFood(row: Record<string, unknown> | Food): Food {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    base_amount: Number(row.base_amount) || 100,
    base_unit: String(row.base_unit || "g"),
    calories: Number(row.calories) || 0,
    protein: Number(row.protein) || 0,
    carbs: Number(row.carbs) || 0,
    fats: Number(row.fats) || 0,
    is_quick_add: Boolean(row.is_quick_add),
    quick_add_amount:
      row.quick_add_amount != null ? Number(row.quick_add_amount) : null,
    image_path: row.image_path != null ? String(row.image_path) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}
