"use client";

interface FoodEntryRow {
  log_date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  quantity: number;
}

interface NutritionSummaryProps {
  entries: FoodEntryRow[];
}

export function NutritionSummary({ entries }: NutritionSummaryProps) {
  const byDate = entries.reduce<
    Record<
      string,
      { calories: number; protein: number; carbs: number; fats: number }
    >
  >((acc, e) => {
    const key = e.log_date;
    if (!acc[key]) {
      acc[key] = { calories: 0, protein: 0, carbs: 0, fats: 0 };
    }
    acc[key].calories += Number(e.calories);
    acc[key].protein += Number(e.protein);
    acc[key].carbs += Number(e.carbs);
    acc[key].fats += Number(e.fats);
    return acc;
  }, {});

  const rows = Object.entries(byDate)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 14);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] border-dashed bg-[var(--card)]/50 p-8 text-center text-sm text-[var(--muted)]">
        No nutrition data yet. Log food in the Food tab.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="max-h-64 overflow-x-auto overflow-y-auto">
        <table className="w-full min-w-[400px] text-left text-sm">
          <thead className="sticky top-0 bg-[var(--card)] text-[var(--muted)]">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Calories</th>
              <th className="px-4 py-2 font-medium">P (g)</th>
              <th className="px-4 py-2 font-medium">C (g)</th>
              <th className="px-4 py-2 font-medium">F (g)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([date, totals]) => (
              <tr
                key={date}
                className="border-t border-[var(--border)] hover:bg-[var(--card-hover)]"
              >
                <td className="px-4 py-2">{date}</td>
                <td className="px-4 py-2 font-medium">
                  {Math.round(totals.calories)} kcal
                </td>
                <td className="px-4 py-2">{totals.protein.toFixed(0)}</td>
                <td className="px-4 py-2">{totals.carbs.toFixed(0)}</td>
                <td className="px-4 py-2">{totals.fats.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--muted)]">
        Daily totals · last 14 days
      </p>
    </div>
  );
}
