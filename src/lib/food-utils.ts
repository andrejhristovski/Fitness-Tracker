import type { Food } from "@/types/database";

export interface CalculatedNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export type NutritionSource = Pick<Food, "base_amount" | "calories" | "protein" | "carbs" | "fats">;

/**
 * Compute nutrition for a given amount (e.g. grams) from a food template.
 * Formula: (amount / base_amount) * base_nutrition
 */
export function calculateNutrition(
  food: NutritionSource,
  amount: number
): CalculatedNutrition {
  if (amount <= 0 || food.base_amount <= 0) {
    return { calories: 0, protein: 0, carbs: 0, fats: 0 };
  }
  const ratio = amount / food.base_amount;
  return {
    calories: Math.round(food.calories * ratio * 100) / 100,
    protein: Math.round(food.protein * ratio * 100) / 100,
    carbs: Math.round(food.carbs * ratio * 100) / 100,
    fats: Math.round(food.fats * ratio * 100) / 100,
  };
}

/** "3 eggs", "150 g", "1 banana" — pluralizes piece units, leaves g/ml alone. */
export function formatAmount(amount: number, unit: string) {
  const lower = unit.toLowerCase();
  const plural = amount !== 1 && !["g", "ml", "kg", "l", "oz"].includes(lower) && !lower.endsWith("s");
  return `${amount} ${plural ? `${unit}s` : unit}`;
}

/** Quick amount buttons for a food's unit. */
export function amountPresets(food: { name: string; base_unit: string }, libraryPresets?: number[]) {
  if (libraryPresets) return libraryPresets;
  const unit = food.base_unit.toLowerCase();
  if (unit === "g" || unit === "ml") return [50, 100, 150, 200, 250];
  if (unit === "serving") return [0.5, 1, 1.5, 2];
  return [1, 2, 3, 4];
}
