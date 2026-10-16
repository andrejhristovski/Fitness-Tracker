/**
 * Built-in exercise library: common gym lifts, curated from the open
 * free-exercise-db (github.com/yuhonas/free-exercise-db) with familiar names.
 */

export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Glutes",
  "Calves",
  "Core",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export type ExerciseIconKey =
  | "bench"
  | "squat"
  | "deadlift"
  | "press"
  | "row"
  | "pullup"
  | "pulldown"
  | "curl"
  | "pushdown"
  | "raise"
  | "fly"
  | "shrug"
  | "lunge"
  | "machine"
  | "calf"
  | "dip"
  | "hipthrust"
  | "plank"
  | "pushup"
  | "dumbbell";

export type Equipment = "Barbell" | "Dumbbell" | "Cable" | "Machine" | "Bodyweight" | "EZ Bar" | "Smith";

export interface LibraryExercise {
  name: string;
  muscle: MuscleGroup;
  equipment: Equipment;
  icon: ExerciseIconKey;
}

const ex = (
  name: string,
  muscle: MuscleGroup,
  equipment: Equipment,
  icon: ExerciseIconKey
): LibraryExercise => ({ name, muscle, equipment, icon });

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Chest
  ex("Barbell Bench Press", "Chest", "Barbell", "bench"),
  ex("Incline Barbell Bench Press", "Chest", "Barbell", "bench"),
  ex("Decline Bench Press", "Chest", "Barbell", "bench"),
  ex("Dumbbell Bench Press", "Chest", "Dumbbell", "bench"),
  ex("Incline Dumbbell Press", "Chest", "Dumbbell", "bench"),
  ex("Smith Machine Bench Press", "Chest", "Smith", "bench"),
  ex("Machine Chest Press", "Chest", "Machine", "machine"),
  ex("Cable Crossover", "Chest", "Cable", "fly"),
  ex("Dumbbell Fly", "Chest", "Dumbbell", "fly"),
  ex("Incline Dumbbell Fly", "Chest", "Dumbbell", "fly"),
  ex("Pec Deck", "Chest", "Machine", "fly"),
  ex("Chest Dip", "Chest", "Bodyweight", "dip"),
  ex("Push-Up", "Chest", "Bodyweight", "pushup"),

  // Back
  ex("Deadlift", "Back", "Barbell", "deadlift"),
  ex("Sumo Deadlift", "Back", "Barbell", "deadlift"),
  ex("Rack Pull", "Back", "Barbell", "deadlift"),
  ex("Barbell Row", "Back", "Barbell", "row"),
  ex("Pendlay Row", "Back", "Barbell", "row"),
  ex("Dumbbell Row", "Back", "Dumbbell", "row"),
  ex("T-Bar Row", "Back", "Barbell", "row"),
  ex("Seated Cable Row", "Back", "Cable", "row"),
  ex("Machine Row", "Back", "Machine", "row"),
  ex("Lat Pulldown", "Back", "Cable", "pulldown"),
  ex("Close-Grip Lat Pulldown", "Back", "Cable", "pulldown"),
  ex("Straight-Arm Pulldown", "Back", "Cable", "pulldown"),
  ex("Pull-Up", "Back", "Bodyweight", "pullup"),
  ex("Chin-Up", "Back", "Bodyweight", "pullup"),
  ex("Back Extension", "Back", "Bodyweight", "deadlift"),
  ex("Barbell Shrug", "Back", "Barbell", "shrug"),
  ex("Dumbbell Shrug", "Back", "Dumbbell", "shrug"),

  // Shoulders
  ex("Overhead Press", "Shoulders", "Barbell", "press"),
  ex("Seated Dumbbell Press", "Shoulders", "Dumbbell", "press"),
  ex("Arnold Press", "Shoulders", "Dumbbell", "press"),
  ex("Machine Shoulder Press", "Shoulders", "Machine", "press"),
  ex("Push Press", "Shoulders", "Barbell", "press"),
  ex("Lateral Raise", "Shoulders", "Dumbbell", "raise"),
  ex("Cable Lateral Raise", "Shoulders", "Cable", "raise"),
  ex("Front Raise", "Shoulders", "Dumbbell", "raise"),
  ex("Rear Delt Fly", "Shoulders", "Dumbbell", "raise"),
  ex("Reverse Pec Deck", "Shoulders", "Machine", "fly"),
  ex("Face Pull", "Shoulders", "Cable", "row"),
  ex("Upright Row", "Shoulders", "Barbell", "shrug"),

  // Biceps
  ex("Barbell Curl", "Biceps", "Barbell", "curl"),
  ex("EZ-Bar Curl", "Biceps", "EZ Bar", "curl"),
  ex("Dumbbell Curl", "Biceps", "Dumbbell", "curl"),
  ex("Hammer Curl", "Biceps", "Dumbbell", "curl"),
  ex("Incline Dumbbell Curl", "Biceps", "Dumbbell", "curl"),
  ex("Preacher Curl", "Biceps", "EZ Bar", "curl"),
  ex("Cable Curl", "Biceps", "Cable", "curl"),
  ex("Concentration Curl", "Biceps", "Dumbbell", "curl"),

  // Triceps
  ex("Triceps Pushdown", "Triceps", "Cable", "pushdown"),
  ex("Rope Pushdown", "Triceps", "Cable", "pushdown"),
  ex("Overhead Cable Extension", "Triceps", "Cable", "pushdown"),
  ex("Skull Crusher", "Triceps", "EZ Bar", "bench"),
  ex("Close-Grip Bench Press", "Triceps", "Barbell", "bench"),
  ex("Triceps Dip", "Triceps", "Bodyweight", "dip"),
  ex("Dumbbell Kickback", "Triceps", "Dumbbell", "pushdown"),

  // Legs
  ex("Back Squat", "Legs", "Barbell", "squat"),
  ex("Front Squat", "Legs", "Barbell", "squat"),
  ex("Goblet Squat", "Legs", "Dumbbell", "squat"),
  ex("Smith Machine Squat", "Legs", "Smith", "squat"),
  ex("Hack Squat", "Legs", "Machine", "squat"),
  ex("Leg Press", "Legs", "Machine", "machine"),
  ex("Leg Extension", "Legs", "Machine", "machine"),
  ex("Lying Leg Curl", "Legs", "Machine", "machine"),
  ex("Seated Leg Curl", "Legs", "Machine", "machine"),
  ex("Romanian Deadlift", "Legs", "Barbell", "deadlift"),
  ex("Stiff-Leg Deadlift", "Legs", "Barbell", "deadlift"),
  ex("Bulgarian Split Squat", "Legs", "Dumbbell", "lunge"),
  ex("Walking Lunge", "Legs", "Dumbbell", "lunge"),
  ex("Barbell Lunge", "Legs", "Barbell", "lunge"),
  ex("Step-Up", "Legs", "Dumbbell", "lunge"),

  // Glutes
  ex("Hip Thrust", "Glutes", "Barbell", "hipthrust"),
  ex("Glute Bridge", "Glutes", "Barbell", "hipthrust"),
  ex("Cable Kickback", "Glutes", "Cable", "lunge"),
  ex("Hip Abduction Machine", "Glutes", "Machine", "machine"),
  ex("Hip Adduction Machine", "Legs", "Machine", "machine"),

  // Calves
  ex("Standing Calf Raise", "Calves", "Machine", "calf"),
  ex("Seated Calf Raise", "Calves", "Machine", "calf"),
  ex("Leg Press Calf Raise", "Calves", "Machine", "calf"),

  // Core
  ex("Cable Crunch", "Core", "Cable", "plank"),
  ex("Hanging Leg Raise", "Core", "Bodyweight", "pullup"),
  ex("Ab Wheel Rollout", "Core", "Bodyweight", "plank"),
  ex("Weighted Plank", "Core", "Bodyweight", "plank"),
  ex("Russian Twist", "Core", "Bodyweight", "plank"),
];

/** One-tap starter days for a classic 3-day split; editable after creation. */
export const PRESET_DAYS: { name: string; exercises: string[] }[] = [
  {
    name: "Chest & Triceps",
    exercises: [
      "Barbell Bench Press",
      "Incline Dumbbell Press",
      "Cable Crossover",
      "Triceps Pushdown",
      "Overhead Cable Extension",
    ],
  },
  {
    name: "Back & Biceps",
    exercises: ["Lat Pulldown", "Barbell Row", "Seated Cable Row", "Barbell Curl", "Hammer Curl"],
  },
  {
    name: "Shoulders & Legs",
    exercises: [
      "Back Squat",
      "Leg Press",
      "Romanian Deadlift",
      "Overhead Press",
      "Lateral Raise",
      "Standing Calf Raise",
    ],
  },
];

const BY_NAME =new Map(EXERCISE_LIBRARY.map((e) => [e.name.toLowerCase(), e]));

const ICON_BY_MUSCLE: Record<string, ExerciseIconKey> = {
  chest: "bench",
  back: "row",
  shoulders: "press",
  biceps: "curl",
  triceps: "pushdown",
  legs: "squat",
  glutes: "hipthrust",
  calves: "calf",
  core: "plank",
};

export function findLibraryExercise(name: string): LibraryExercise | undefined {
  return BY_NAME.get(name.trim().toLowerCase());
}

/** Icon for a saved exercise: library match by name, else by muscle group. */
export function iconForExercise(name: string, muscleGroup: string | null): ExerciseIconKey {
  return (
    findLibraryExercise(name)?.icon ??
    ICON_BY_MUSCLE[(muscleGroup ?? "").trim().toLowerCase()] ??
    "dumbbell"
  );
}
