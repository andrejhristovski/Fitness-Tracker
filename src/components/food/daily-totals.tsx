interface DailyTotalsProps {
  totals: { calories: number; protein: number; carbs: number; fats: number };
}

export function DailyTotals({ totals }: DailyTotalsProps) {
  const items = [
    { label: "Calories", value: Math.round(totals.calories), unit: "kcal" },
    { label: "Protein", value: totals.protein.toFixed(0), unit: "g" },
    { label: "Carbs", value: totals.carbs.toFixed(0), unit: "g" },
    { label: "Fats", value: totals.fats.toFixed(0), unit: "g" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ label, value, unit }) => (
        <div
          key={label}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:bg-[var(--card-hover)]"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {value}
            <span className="ml-1 text-base font-normal text-[var(--muted)]">
              {unit}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}
