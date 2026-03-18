"use client";

import type { NutritionGoals } from "@/lib/nutrition-goals";

interface DailyNutritionProgressProps {
  totals: { calories: number; protein: number; carbs: number; fats: number };
  goals: NutritionGoals;
}

const ICONS = {
  Calories: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5 text-orange-500">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  ),
  Protein: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5 text-emerald-600">
      <path d="M15 5v2a4 4 0 0 1-4 4H8" />
      <path d="M9 5v2a4 4 0 0 0 4 4h3" />
      <path d="M9 12v7l4-4 4 4v-7" />
      <path d="M9 5l3-2 3 2" />
    </svg>
  ),
  Carbs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5 text-violet-500">
      <path d="M4 12h16" />
      <path d="M7 8v8" />
      <path d="M12 6v12" />
      <path d="M17 4v16" />
    </svg>
  ),
  Fats: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5 text-amber-600">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
} as const;

const ICON_BG = {
  Calories: "bg-orange-100 border-orange-200",
  Protein: "bg-emerald-100 border-emerald-200",
  Carbs: "bg-violet-100 border-violet-200",
  Fats: "bg-amber-100 border-amber-200",
} as const;

type MetricLabel = keyof typeof ICONS;

function ProgressCard({
  label,
  current,
  goal,
  unit,
  format,
}: {
  label: MetricLabel;
  current: number;
  goal: number;
  unit: string;
  format: (v: number) => string;
}) {
  const percent = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  return (
    <div className="flex min-h-[160px] flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      {/* Top: icon + name */}
      <div className="flex items-center gap-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full border ${ICON_BG[label]}`}
        >
          {ICONS[label]}
        </div>
        <span className="text-base font-medium text-[var(--foreground)]">
          {label}
        </span>
      </div>

      {/* Middle: big counter + unit */}
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
          {format(current)}
        </span>
        <span className="text-sm font-normal text-[var(--muted)]">
          / {format(goal)} {unit}
        </span>
      </div>

      {/* Bottom: progress bar */}
      <div className="mt-auto pt-4">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function DailyNutritionProgress({ totals, goals }: DailyNutritionProgressProps) {
  const bars: { label: MetricLabel; current: number; goal: number; unit: string; format: (v: number) => string }[] = [
    { label: "Calories", current: totals.calories, goal: goals.calories, unit: "kcal", format: (v) => Math.round(v).toString() },
    { label: "Protein", current: totals.protein, goal: goals.protein, unit: "g", format: (v) => v.toFixed(0) },
    { label: "Carbs", current: totals.carbs, goal: goals.carbs, unit: "g", format: (v) => v.toFixed(0) },
    { label: "Fats", current: totals.fats, goal: goals.fats, unit: "g", format: (v) => v.toFixed(0) },
  ];

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
        Daily progress
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {bars.map(({ label, current, goal, unit, format }) => (
          <ProgressCard
            key={label}
            label={label}
            current={current}
            goal={goal}
            unit={unit}
            format={format}
          />
        ))}
      </div>
    </div>
  );
}
