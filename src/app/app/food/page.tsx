import { and, asc, eq, gte, isNotNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/session";
import { FoodTab } from "@/components/food/food-tab";
import { goalsFromSettings } from "@/lib/nutrition-goals";
import { getUserToday } from "@/lib/user-date";
import { addDays } from "@/lib/dates";

const { foodEntries, foods, userSettings } = schema;

export default async function FoodPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requireUser();
  const today = await getUserToday();
  const { date: requested } = await searchParams;
  const logDate =
    requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) && requested <= today ? requested : today;

  const [entries, userFoods, [settings], recentRows] = await Promise.all([
    db
      .select()
      .from(foodEntries)
      .where(and(eq(foodEntries.user_id, user.id), eq(foodEntries.log_date, logDate)))
      .orderBy(asc(foodEntries.created_at)),
    db.select().from(foods).where(eq(foods.user_id, user.id)).orderBy(asc(foods.name)),
    db.select().from(userSettings).where(eq(userSettings.user_id, user.id)),
    db
      .select({ foodId: foodEntries.food_id, quantity: foodEntries.quantity })
      .from(foodEntries)
      .where(
        and(eq(foodEntries.user_id, user.id), gte(foodEntries.log_date, addDays(today, -30)), isNotNull(foodEntries.food_id))
      )
      .orderBy(asc(foodEntries.created_at)),
  ]);

  // Foods ordered by how often they were logged recently, with the usual amount for each.
  const usage = new Map<string, { count: number; lastAmount: number }>();
  for (const row of recentRows) {
    const u = usage.get(row.foodId!) ?? { count: 0, lastAmount: 0 };
    usage.set(row.foodId!, { count: u.count + 1, lastAmount: row.quantity || u.lastAmount });
  }
  const recent = [...usage.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([foodId, u]) => ({ foodId, amount: u.lastAmount }));

  return (
    <FoodTab
      key={logDate}
      initialEntries={entries}
      initialFoods={userFoods}
      goals={goalsFromSettings(settings ?? null)}
      recent={recent}
      logDate={logDate}
      today={today}
    />
  );
}
