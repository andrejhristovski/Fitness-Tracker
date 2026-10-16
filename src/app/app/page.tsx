import { createClient } from "@/lib/supabase/server";
import { FoodTab } from "@/components/food/food-tab";
import { goalsFromSettings } from "@/lib/nutrition-goals";
import { getUserToday } from "@/lib/user-date";
import { addDays } from "@/lib/dates";
import { normalizeFood } from "@/lib/normalize-food";
import type { FoodEntry } from "@/types/database";

export default async function AppDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = await getUserToday();
  const { date: requested } = await searchParams;
  const logDate =
    requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) && requested <= today ? requested : today;

  const [entriesRes, foodsRes, settingsRes, recentRes] = await Promise.all([
    supabase
      .from("food_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("log_date", logDate)
      .order("created_at"),
    supabase.from("foods").select("*").eq("user_id", user.id).order("name"),
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("food_entries")
      .select("food_id, quantity")
      .eq("user_id", user.id)
      .gte("log_date", addDays(today, -30))
      .not("food_id", "is", null)
      .order("created_at"),
  ]);

  // Foods ordered by how often they were logged recently, with the usual amount for each.
  const usage = new Map<string, { count: number; lastAmount: number }>();
  for (const row of recentRes.data ?? []) {
    const u = usage.get(row.food_id) ?? { count: 0, lastAmount: 0 };
    usage.set(row.food_id, { count: u.count + 1, lastAmount: Number(row.quantity) || u.lastAmount });
  }
  const recent = [...usage.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([foodId, u]) => ({ foodId, amount: u.lastAmount }));

  return (
    <FoodTab
      key={logDate}
      initialEntries={(entriesRes.data ?? []) as FoodEntry[]}
      initialFoods={(foodsRes.data ?? []).map(normalizeFood)}
      goals={goalsFromSettings(settingsRes.data ?? null)}
      recent={recent}
      logDate={logDate}
      today={today}
    />
  );
}
