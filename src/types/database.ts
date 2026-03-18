export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Food {
  id: string;
  user_id: string;
  name: string;
  base_amount: number;
  base_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  is_quick_add: boolean;
  quick_add_amount: number | null;
  image_path: string | null;
  created_at: string;
}

export interface FoodEntry {
  id: string;
  user_id: string;
  food_id: string | null;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  quantity: number;
  log_date: string;
  image_path: string | null;
  created_at: string;
}

export interface ExerciseDefinition {
  id: string;
  user_id: string;
  name: string;
  muscle_group: string | null;
  created_at: string;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface WorkoutTemplateExercise {
  id: string;
  template_id: string;
  exercise_definition_id: string;
  sort_order: number;
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  session_date: string;
  name: string | null;
  notes: string | null;
  started_at: string | null;
  created_at: string;
}

export interface ExerciseEntry {
  id: string;
  session_id: string;
  exercise_definition_id: string | null;
  name: string;
  sets: number;
  reps: number | null;
  weight_kg: number | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  height_cm: number | null;
  current_weight_kg: number | null;
  target_weight_kg: number | null;
  calories_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fats_goal: number;
  created_at: string;
  updated_at: string;
}

export interface BodyLog {
  id: string;
  user_id: string;
  log_date: string;
  weight_kg: number | null;
  notes: string | null;
  created_at: string;
}

export interface FoodInsert {
  user_id: string;
  name: string;
  base_amount?: number;
  base_unit?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  is_quick_add?: boolean;
  quick_add_amount?: number | null;
}

export interface FoodEntryInsert {
  user_id: string;
  food_id?: string | null;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  quantity?: number;
  log_date: string;
}

export interface WorkoutSessionInsert {
  user_id: string;
  session_date: string;
  name?: string | null;
  notes?: string | null;
}

export interface ExerciseEntryInsert {
  session_id: string;
  exercise_definition_id?: string | null;
  name: string;
  sets: number;
  reps?: number | null;
  weight_kg?: number | null;
  notes?: string | null;
  sort_order?: number;
}

export interface UserSettingsInsert {
  user_id: string;
  height_cm?: number | null;
  current_weight_kg?: number | null;
  target_weight_kg?: number | null;
  calories_goal?: number;
  protein_goal?: number;
  carbs_goal?: number;
  fats_goal?: number;
}

export interface UserSettingsUpdate {
  height_cm?: number | null;
  current_weight_kg?: number | null;
  target_weight_kg?: number | null;
  calories_goal?: number;
  protein_goal?: number;
  carbs_goal?: number;
  fats_goal?: number;
}

export interface BodyLogInsert {
  user_id: string;
  log_date: string;
  weight_kg?: number | null;
  notes?: string | null;
}
