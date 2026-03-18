import type { Food } from "@/types/database";

export interface CalculatedNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

/**
 * Compute nutrition for a given amount (e.g. grams) from a food template.
 * Formula: (amount / base_amount) * base_nutrition
 */
export function calculateNutrition(
  food: Food,
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
