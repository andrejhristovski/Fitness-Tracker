import { createClient } from "@/lib/supabase/server";
import { fetchExerciseHistory } from "@/lib/exercise-history";
import { goalsFromSettings } from "@/lib/nutrition-goals";
import { StatsTab } from "@/components/stats/stats-tab";
import type { BodyLog, ExerciseDefinition, UserSettings } from "@/types/database";

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Enough history for the 90-day view plus the period before it.
  const since = new Date();
  since.setDate(since.getDate() - 200);
  const sinceKey = since.toISOString().slice(0, 10);

  const [foodRes, bodyRes, settingsRes, sessionsRes, definitionsRes, history] = await Promise.all([
    supabase
      .from("food_entries")
      .select("log_date, calories, protein, carbs, fats")
      .eq("user_id", user.id)
      .gte("log_date", sinceKey),
    supabase.from("body_logs").select("*").eq("user_id", user.id).order("log_date"),
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("session_date, exercise_entries(id)")
      .eq("user_id", user.id)
      .gte("session_date", sinceKey),
    supabase.from("exercise_definitions").select("*").eq("user_id", user.id),
    fetchExerciseHistory(supabase, user.id),
  ]);

  // Daily nutrition totals.
  const nutrition: Record<string, { calories: number; protein: number; carbs: number; fats: number }> = {};
  for (const e of foodRes.data ?? []) {
    const day = (nutrition[e.log_date] ??= { calories: 0, protein: 0, carbs: 0, fats: 0 });
    day.calories += Number(e.calories);
    day.protein += Number(e.protein);
    day.carbs += Number(e.carbs);
    day.fats += Number(e.fats);
  }

  // A day counts as trained when it has a session with at least one exercise.
  const trainedDays = [
    ...new Set(
      (sessionsRes.data ?? [])
        .filter((s) => (s.exercise_entries ?? []).length > 0)
        .map((s) => s.session_date as string)
    ),
  ];

  const settings = settingsRes.data as UserSettings | null;

  return (
    <StatsTab
      nutrition={nutrition}
      goals={goalsFromSettings(settings)}
      bodyLogs={(bodyRes.data ?? []) as BodyLog[]}
      targetWeightKg={settings?.target_weight_kg ?? null}
      trainedDays={trainedDays}
      definitions={(definitionsRes.data ?? []) as ExerciseDefinition[]}
      history={history}
    />
  );
}
