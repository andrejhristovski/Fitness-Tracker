export const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snack", label: "Snacks" },
] as const;

export type MealType = (typeof MEAL_TYPES)[number]["id"];

/** Sensible default meal for the current time of day. */
export function mealForNow(date = new Date()): MealType {
  const h = date.getHours();
  if (h < 11) return "breakfast";
  if (h < 16) return "lunch";
  if (h < 21) return "dinner";
  return "snack";
}

/** Entries saved before meal types existed (or with an unknown value) go under Snacks. */
export function normalizeMealType(value: string | null | undefined): MealType {
  return MEAL_TYPES.some((m) => m.id === value) ? (value as MealType) : "snack";
}

/** Public image paths may contain spaces (e.g. "Cottage cheese.jpg"). */
export function imageSrc(path: string | null) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path; // e.g. product photos from Open Food Facts
  return path.split("/").map(encodeURIComponent).join("/");
}
