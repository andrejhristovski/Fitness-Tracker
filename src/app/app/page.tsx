import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { FoodTab } from "@/components/food/food-tab";
import { goalsFromSettings } from "@/lib/nutrition-goals";

function FoodTabFallback() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 animate-pulse rounded-lg bg-[var(--card)]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl bg-[var(--card)]"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-[var(--card)]" />
    </div>
  );
}

export default async function AppDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const today = new Date().toISOString().slice(0, 10);

  const [entriesRes, foodsRes, settingsRes] = await Promise.all([
    supabase
      .from("food_entries")
      .select("*")
      .eq("log_date", today)
      .order("created_at", { ascending: false }),
    supabase.from("foods").select("id, user_id, name, base_amount, base_unit, calories, protein, carbs, fats, is_quick_add, quick_add_amount, image_path, created_at").order("name"),
    user
      ? supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const goals = goalsFromSettings(settingsRes.data ?? null);

  const foods = (foodsRes.data ?? []).map((f) => ({
    ...f,
    is_quick_add: Boolean(f.is_quick_add),
    quick_add_amount: f.quick_add_amount != null ? Number(f.quick_add_amount) : null,
  }));

  return (
    <Suspense fallback={<FoodTabFallback />}>
      <FoodTab
        initialEntries={entriesRes.data ?? []}
        initialFoods={foods}
        initialGoals={goals}
        logDate={today}
      />
    </Suspense>
  );
}
