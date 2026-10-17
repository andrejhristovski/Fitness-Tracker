import Link from "next/link";
import type { NutritionGoals } from "@/lib/nutrition-goals";
import { addDays, parseDate } from "@/lib/dates";
import { Greeting } from "./greeting";

interface HomeViewProps {
  name: string;
  today: string;
  weekStart: string;
  goals: NutritionGoals;
  eaten: { calories: number; protein: number };
  weightKg: number | null;
  trainedDays: string[];
  weeklyTarget: number;
  workout: { name: string; total: number; done: number } | null;
}

const ICON = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const Flame = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" {...ICON} className={p.className}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />
  </svg>
);
const Drop = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" {...ICON} className={p.className}>
    <path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z" />
  </svg>
);
const Scale = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" {...ICON} className={p.className}>
    <rect x="3" y="4" width="18" height="16" rx="4" />
    <path d="M9 9.5a4 4 0 0 1 6 0M12 12l1.5-2.5" />
  </svg>
);
const Dumbbell = (p: { className?: string }) => (
  <svg viewBox="0 0 24 24" {...ICON} className={p.className}>
    <path d="M8 12h8M4 9v6M7 7v10M17 7v10M20 9v6" />
  </svg>
);
const Chevron = () => (
  <svg viewBox="0 0 24 24" {...ICON} className="h-5 w-5 text-[var(--muted)]">
    <path d="m9 6 6 6-6 6" />
  </svg>
);

/** Big lime → mint progress ring (Midnight Lime). */
function Ring({ value, goal }: { value: number; goal: number }) {
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const r = 84;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto h-56 w-56">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ring-lime" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={r} fill="none" stroke="var(--card-hover)" strokeWidth={16} />
        <circle
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="url(#ring-lime)"
          strokeWidth={16}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Flame className="mb-1 h-7 w-7 text-[var(--accent)]" />
        <span className="text-4xl font-bold tabular-nums">{Math.round(value).toLocaleString()}</span>
        <span className="text-sm text-[var(--muted)]">of {goal.toLocaleString()} kcal</span>
      </div>
    </div>
  );
}

function Tile({ icon, value, unit, color }: { icon: React.ReactNode; value: string; unit: string; color: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-[var(--card)] py-4">
      <span className="h-6 w-6" style={{ color }}>
        {icon}
      </span>
      <span className="mt-1.5 text-xl font-bold tabular-nums">{value}</span>
      <span className="text-xs text-[var(--muted)]">{unit}</span>
    </div>
  );
}

export function HomeView({ name, today, weekStart, goals, eaten, weightKg, trainedDays, weeklyTarget, workout }: HomeViewProps) {
  const left = Math.round(goals.calories - eaten.calories);
  const workoutPct = workout && workout.total > 0 ? Math.round((workout.done / workout.total) * 100) : 0;
  const trained = new Set(trainedDays);
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const doneThisWeek = week.filter((d) => trained.has(d)).length;

  return (
    <div className="mx-auto max-w-xl space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Greeting name={name} />
          <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-[var(--accent)]">Let&apos;s move!</h1>
        </div>
        <Link
          href="/app/settings"
          aria-label="Profile and settings"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--card)] text-lg font-semibold text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
        >
          {name.trim().charAt(0).toUpperCase() || "?"}
        </Link>
      </div>

      {/* Calories ring */}
      <Link href="/app/food" className="block rounded-3xl py-2 transition-opacity active:opacity-80" aria-label="Open food log">
        <Ring value={eaten.calories} goal={goals.calories} />
        <p className="mt-1 text-center text-sm text-[var(--muted)]">
          {left >= 0 ? (
            <>
              <span className="font-semibold text-[var(--foreground)]">{left.toLocaleString()}</span> kcal left today
            </>
          ) : (
            <>
              <span className="font-semibold text-[var(--foreground)]">{Math.abs(left).toLocaleString()}</span> kcal over goal
            </>
          )}
        </p>
      </Link>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-3">
        <Tile icon={<Flame className="h-6 w-6" />} value={Math.round(eaten.calories).toLocaleString()} unit="calories" color="#ff8a4c" />
        <Tile
          icon={<Drop className="h-6 w-6" />}
          value={`${Math.round(eaten.protein)}`}
          unit={`of ${goals.protein} g protein`}
          color="var(--accent-2)"
        />
        <Tile
          icon={<Scale className="h-6 w-6" />}
          value={weightKg != null ? `${Math.round(weightKg * 10) / 10}` : "—"}
          unit="kg"
          color="var(--accent)"
        />
      </div>

      {/* Today's workout (lime progress) */}
      <Link href="/app/workouts" className="block rounded-2xl bg-[var(--card)] p-4 transition-colors hover:bg-[var(--card-hover)]">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent)]/12 text-[var(--accent)]">
            <Dumbbell className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-[var(--muted)]">Today&apos;s workout</span>
            <span className="block truncate font-semibold">{workout ? workout.name : "Set up your workout days"}</span>
          </span>
          <Chevron />
        </div>
        {workout && (
          <div className="mt-4 flex items-center gap-3">
            <span className="w-10 text-sm font-semibold tabular-nums">{workoutPct}%</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[var(--card-hover)]">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] transition-[width] duration-700"
                style={{ width: `${workoutPct}%` }}
              />
            </span>
            <span className="text-xs text-[var(--muted)] tabular-nums">
              {workout.done}/{workout.total}
            </span>
          </div>
        )}
      </Link>

      {/* Weekly goal (Purple Energy dots) */}
      <Link href="/app/stats" className="block rounded-2xl bg-[var(--card)] p-4 transition-colors hover:bg-[var(--card-hover)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Weekly goal</p>
            <p className="text-xs text-[var(--muted)]">
              {doneThisWeek} of {weeklyTarget} workouts
            </p>
          </div>
          <Chevron />
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1">
          {week.map((d) => {
            const done = trained.has(d);
            const isToday = d === today;
            const future = d > today;
            return (
              <div key={d} className="flex flex-col items-center gap-1.5">
                <span
                  className={`h-8 w-8 rounded-full ${
                    done
                      ? "bg-gradient-to-br from-[var(--purple)] to-[var(--pink)] shadow-[0_0_12px_rgba(155,123,255,0.45)]"
                      : isToday
                        ? "border-[3px] border-[var(--purple)]"
                        : future
                          ? "bg-[var(--card-hover)]"
                          : "bg-[var(--card-hover)] opacity-60"
                  }`}
                  aria-label={`${parseDate(d).toLocaleDateString(undefined, { weekday: "long" })}: ${done ? "trained" : "no workout"}`}
                />
                <span className={`text-[11px] ${isToday ? "font-semibold text-[var(--foreground)]" : "text-[var(--muted)]"}`}>
                  {parseDate(d).toLocaleDateString(undefined, { weekday: "narrow" })}
                </span>
              </div>
            );
          })}
        </div>
      </Link>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/app/food"
          className="rounded-2xl bg-[var(--accent)] py-3.5 text-center font-semibold text-[var(--on-accent)] transition-colors hover:bg-[var(--accent-hover)]"
        >
          + Log food
        </Link>
        <Link
          href="/app/workouts"
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] py-3.5 text-center font-semibold transition-colors hover:bg-[var(--card-hover)]"
        >
          Log workout
        </Link>
      </div>
    </div>
  );
}
