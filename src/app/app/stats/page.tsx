import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { StatsTab } from "@/components/stats/stats-tab";

async function getStatsData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { bodyLogs: [], foodEntries: [], sessions: [], currentWeightKg: null };

  const [bodyRes, foodRes, sessionsRes, settingsRes] = await Promise.all([
    supabase
      .from("body_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(90),
    supabase
      .from("food_entries")
      .select("log_date, calories, protein, carbs, fats, quantity")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(500),
    supabase
      .from("workout_sessions")
      .select("id, session_date, name")
      .eq("user_id", user.id)
      .order("session_date", { ascending: false })
      .limit(90),
    supabase.from("user_settings").select("current_weight_kg").eq("user_id", user.id).maybeSingle(),
  ]);

  const bodyLogs = bodyRes.data ?? [];
  const settings = settingsRes.data;
  const currentWeightKg =
    bodyLogs.length > 0 && bodyLogs[0].weight_kg != null
      ? bodyLogs[0].weight_kg
      : settings?.current_weight_kg ?? null;

  return {
    bodyLogs,
    foodEntries: foodRes.data ?? [],
    sessions: sessionsRes.data ?? [],
    currentWeightKg,
  };
}

function StatsFallback() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 animate-pulse rounded-lg bg-[var(--card)]" />
      <div className="h-48 animate-pulse rounded-xl bg-[var(--card)]" />
      <div className="h-48 animate-pulse rounded-xl bg-[var(--card)]" />
    </div>
  );
}

export default async function StatsPage() {
  const data = await getStatsData();

  return (
    <Suspense fallback={<StatsFallback />}>
      <StatsTab
        bodyLogs={data.bodyLogs}
        foodEntries={data.foodEntries}
        sessions={data.sessions}
        currentWeightKg={data.currentWeightKg}
      />
    </Suspense>
  );
}
