import type { UserSettings } from "@/types/database";

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export const DEFAULT_NUTRITION_GOALS: NutritionGoals = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fats: 65,
};

/** Build NutritionGoals from user_settings row; falls back to defaults if null. */
export function goalsFromSettings(settings: UserSettings | null): NutritionGoals {
  if (!settings) return DEFAULT_NUTRITION_GOALS;
  return {
    calories: settings.calories_goal,
    protein: settings.protein_goal,
    carbs: settings.carbs_goal,
    fats: settings.fats_goal,
  };
}
