import type { NutritionGoals } from "@/lib/nutrition-goals";
import { Meter } from "@/components/stats/charts";
import { MACRO_COLORS } from "@/lib/macro-colors";

type Totals = { calories: number; protein: number; carbs: number; fats: number };

/** Calorie ring (eaten vs goal) with macro bars beside it. */
export function DaySummary({ totals, goals }: { totals: Totals; goals: NutritionGoals }) {
  const pct = goals.calories > 0 ? totals.calories / goals.calories : 0;
  const remaining = Math.round(goals.calories - totals.calories);
  const over = remaining < 0;
  const r = 52;
  const c = 2 * Math.PI * r;

  return (
    <section className="grid gap-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="flex items-center gap-5">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={r} fill="none" stroke="var(--card-hover)" strokeWidth={10} />
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={over ? "#e66767" : "var(--accent)"}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - Math.min(pct, 1))}
              className="transition-[stroke-dashoffset] duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{Math.round(totals.calories).toLocaleString()}</span>
            <span className="text-xs text-[var(--muted)]">of {goals.calories.toLocaleString()} kcal</span>
          </div>
        </div>
        <div className="sm:hidden">
          <p className="text-3xl font-bold">{Math.abs(remaining).toLocaleString()}</p>
          <p className="text-sm text-[var(--muted)]">{over ? "kcal over goal" : "kcal left"}</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="hidden text-sm sm:block">
          <span className="text-xl font-bold">{Math.abs(remaining).toLocaleString()}</span>{" "}
          <span className="text-[var(--muted)]">{over ? "kcal over goal" : "kcal left"}</span>
        </p>
        <Meter label="Protein" value={totals.protein} goal={goals.protein} unit="g" color={MACRO_COLORS.protein} />
        <Meter label="Carbs" value={totals.carbs} goal={goals.carbs} unit="g" color={MACRO_COLORS.carbs} />
        <Meter label="Fats" value={totals.fats} goal={goals.fats} unit="g" color={MACRO_COLORS.fats} />
      </div>
    </section>
  );
}
