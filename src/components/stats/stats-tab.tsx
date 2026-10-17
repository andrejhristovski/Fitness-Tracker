"use client";

import { useMemo, useState } from "react";
import type { BodyLog, ExerciseDefinition } from "@/types/database";
import type { MaxLog } from "@/app/actions/workout-actions";
import type { NutritionGoals } from "@/lib/nutrition-goals";
import { addDays, formatShortDate, lastDays, localDate } from "@/lib/dates";
import { MUSCLE_GROUPS, iconForExercise } from "@/lib/exercise-library";
import { MACRO_COLORS } from "@/lib/macro-colors";
import { ExerciseIcon } from "@/components/workouts/exercise-icon";
import { AddBodyLogForm } from "./add-body-log-form";
import { ColumnChart, LineChart, Meter, StatTile, TrainingCalendar, formatNumber } from "./charts";

type DayNutrition = { calories: number; protein: number; carbs: number; fats: number };

interface StatsTabProps {
  nutrition: Record<string, DayNutrition>;
  goals: NutritionGoals;
  bodyLogs: BodyLog[];
  targetWeightKg: number | null;
  trainedDays: string[];
  definitions: ExerciseDefinition[];
  history: Record<string, MaxLog[]>;
}

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

function signed(v: number, digits = 1) {
  const r = Number(v.toFixed(digits));
  return `${r > 0 ? "+" : r < 0 ? "−" : "±"}${Math.abs(r)}`;
}

function Card({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-[var(--muted)]">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--muted)]">
      {children}
    </div>
  );
}

export function StatsTab({ nutrition, goals, bodyLogs: initialBodyLogs, targetWeightKg, trainedDays, definitions, history }: StatsTabProps) {
  const [today] = useState(localDate);
  const [range, setRange] = useState<number>(30);
  const [bodyLogs, setBodyLogs] = useState(initialBodyLogs);

  const days = useMemo(() => lastDays(today, range), [today, range]);
  const start = days[0];
  const trained = useMemo(() => new Set(trainedDays), [trainedDays]);

  // ---- Nutrition ----
  const loggedDays = days.filter((d) => nutrition[d]?.calories > 0);
  const avg = (key: keyof DayNutrition) =>
    loggedDays.length ? loggedDays.reduce((s, d) => s + nutrition[d][key], 0) / loggedDays.length : 0;
  const avgCalories = avg("calories");

  const calorieBars =
    range <= 30
      ? days.map((d) => {
          const v = nutrition[d]?.calories ?? null;
          return {
            key: d,
            label: formatShortDate(d),
            value: v,
            tooltip: v ? `${formatShortDate(d)} · ${Math.round(v)} kcal` : `${formatShortDate(d)} · nothing logged`,
          };
        })
      : Array.from({ length: Math.ceil(days.length / 7) }, (_, w) => {
          const week = days.slice(w * 7, w * 7 + 7);
          const logged = week.filter((d) => nutrition[d]?.calories > 0);
          const v = logged.length ? logged.reduce((s, d) => s + nutrition[d].calories, 0) / logged.length : null;
          return {
            key: week[0],
            label: formatShortDate(week[0]),
            value: v,
            tooltip: v
              ? `Week of ${formatShortDate(week[0])} · avg ${Math.round(v)} kcal (${logged.length} days)`
              : `Week of ${formatShortDate(week[0])} · nothing logged`,
          };
        });

  // ---- Training ----
  const trainedInRange = days.filter((d) => trained.has(d)).length;
  const calendarDays = lastDays(today, 7 * 13);
  const weekStart = addDays(today, -((new Date().getDay() + 6) % 7));

  // ---- Muscle groups: exercises logged per muscle, this week (Mon–today) vs last week ----
  const lastWeekStart = addDays(weekStart, -7);
  const muscleOf = new Map(definitions.map((d) => [d.id, d.muscle_group ?? "Other"]));
  const muscleWeeks = new Map<string, { thisWeek: number; lastWeek: number }>(
    [...MUSCLE_GROUPS, "Other"].map((m) => [m, { thisWeek: 0, lastWeek: 0 }])
  );
  for (const [id, logs] of Object.entries(history)) {
    const counts = muscleWeeks.get(muscleOf.get(id) ?? "Other");
    if (!counts) continue;
    for (const l of logs) {
      if (l.date >= weekStart && l.date <= today) counts.thisWeek++;
      else if (l.date >= lastWeekStart && l.date < weekStart) counts.lastWeek++;
    }
  }
  const muscleRows = [...muscleWeeks.entries()].filter(([m, c]) => m !== "Other" || c.thisWeek + c.lastWeek > 0);
  const muscleMax = Math.max(1, ...muscleRows.map(([, c]) => Math.max(c.thisWeek, c.lastWeek)));
  const thisWeek = lastDays(today, 7).filter((d) => d >= weekStart && trained.has(d)).length;

  // ---- Strength ----
  const withHistory = definitions
    .filter((d) => (history[d.id]?.length ?? 0) > 0)
    .sort((a, b) => (history[b.id].at(-1)!.date).localeCompare(history[a.id].at(-1)!.date));
  const [exerciseId, setExerciseId] = useState<string | null>(withHistory[0]?.id ?? null);
  const selected = withHistory.find((d) => d.id === exerciseId) ?? withHistory[0] ?? null;
  const selectedHistory = selected ? history[selected.id] : [];
  const inRange = selectedHistory.filter((h) => h.date >= start);
  const strengthPoints = (inRange.length >= 2 ? inRange : selectedHistory).map((h) => ({ date: h.date, value: h.kg }));
  const showingAllTime = inRange.length < 2 && selectedHistory.length >= 2;

  /** Change over the range: latest vs the last value before the range (or the first inside it). */
  function rangeChange(h: MaxLog[]) {
    const latest = h.at(-1);
    if (!latest || latest.date < start) return null;
    const before = [...h].reverse().find((x) => x.date < start) ?? h.find((x) => x.date >= start);
    if (!before || before === latest) return null;
    return latest.kg - before.kg;
  }
  const prsInRange = withHistory.filter((d) => {
    const h = history[d.id];
    const best = Math.max(...h.map((x) => x.kg));
    // New PR: the best was first reached in this period and beat an earlier log
    // (an exercise's first-ever log doesn't count).
    const firstBest = h.findIndex((x) => x.kg === best);
    return firstBest > 0 && h[firstBest].date >= start;
  }).length;

  // ---- Body weight ----
  const weights = bodyLogs.filter((l) => l.weight_kg != null).map((l) => ({ date: l.log_date, value: Number(l.weight_kg) }));
  const weightsInRange = weights.filter((w) => w.date >= start);
  const weightPoints = weightsInRange.length >= 2 ? weightsInRange : weights;
  const latestWeight = weights.at(-1) ?? null;
  const weightChange =
    weightPoints.length >= 2 ? weightPoints[weightPoints.length - 1].value - weightPoints[0].value : null;
  const towardTarget =
    weightChange == null || targetWeightKg == null || latestWeight == null || weightChange === 0
      ? null
      : Math.sign(weightChange) === Math.sign(targetWeightKg - weightPoints[0].value);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stats</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {formatShortDate(start)} – {formatShortDate(today)}
          </p>
        </div>
        <div className="flex rounded-xl border border-[var(--border)] bg-[var(--card)] p-1" role="tablist">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              role="tab"
              aria-selected={range === r.days}
              onClick={() => setRange(r.days)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                range === r.days ? "bg-[var(--accent)] text-[var(--on-accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Avg calories"
          value={loggedDays.length ? Math.round(avgCalories).toLocaleString() : "—"}
          unit="kcal"
          delta={loggedDays.length ? { text: `${signed(avgCalories - goals.calories, 0)}`, good: null } : null}
          sub={loggedDays.length ? `vs ${goals.calories.toLocaleString()} goal` : "No food logged"}
        />
        <StatTile
          label="Avg protein"
          value={loggedDays.length ? String(Math.round(avg("protein"))) : "—"}
          unit="g"
          delta={loggedDays.length ? { text: `${Math.round((avg("protein") / goals.protein) * 100)}%`, good: avg("protein") >= goals.protein * 0.9 } : null}
          sub={`of ${goals.protein} g goal`}
        />
        <StatTile
          label="Workouts"
          value={String(trainedInRange)}
          unit={trainedInRange === 1 ? "day" : "days"}
          sub={`${((trainedInRange / range) * 7).toFixed(1)} per week`}
        />
        <StatTile
          label="Body weight"
          value={latestWeight ? formatNumber(latestWeight.value) : "—"}
          unit="kg"
          delta={weightChange != null ? { text: `${signed(weightChange)} kg`, good: towardTarget } : null}
          sub={
            weightChange != null
              ? weightsInRange.length >= 2
                ? `in ${range} days`
                : "all time"
              : latestWeight
                ? "Log more to see a trend"
                : "Not logged yet"
          }
        />
      </div>

      {/* Nutrition */}
      <Card
        title="Calories"
        subtitle={`${range <= 30 ? "Per day" : "Weekly average"} · logged ${loggedDays.length} of ${range} days`}
      >
        {loggedDays.length === 0 ? (
          <Empty>No food logged in this period. Log meals in the Food tab.</Empty>
        ) : (
          <>
            <ColumnChart bars={calorieBars} goal={goals.calories} goalLabel={`Goal ${goals.calories.toLocaleString()}`} />
            <div className="mt-6 space-y-4 border-t border-[var(--border)] pt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Average macros per logged day
              </p>
              <Meter label="Protein" value={avg("protein")} goal={goals.protein} unit="g" color={MACRO_COLORS.protein} />
              <Meter label="Carbs" value={avg("carbs")} goal={goals.carbs} unit="g" color={MACRO_COLORS.carbs} />
              <Meter label="Fats" value={avg("fats")} goal={goals.fats} unit="g" color={MACRO_COLORS.fats} />
            </div>
          </>
        )}
      </Card>

      {/* Strength */}
      <Card
        title="Strength progress"
        subtitle={
          withHistory.length
            ? `Daily max weight${showingAllTime ? " · all time (not enough logs in this period)" : ""} · ${prsInRange} new PR${prsInRange === 1 ? "" : "s"} in ${range} days`
            : undefined
        }
      >
        {!selected ? (
          <Empty>Log your max kg in the Workouts tab to see progress here.</Empty>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {withHistory.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setExerciseId(d.id)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    d.id === selected.id
                      ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {d.name}
                </button>
              ))}
            </div>
            {strengthPoints.length >= 2 ? (
              <LineChart points={strengthPoints} unit="kg" />
            ) : (
              <Empty>
                Only one log for {selected.name} so far ({strengthPoints[0]?.value} kg). Log it again to see a line.
              </Empty>
            )}

            <div className="mt-6 overflow-x-auto border-t border-[var(--border)] pt-4">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="text-xs text-[var(--muted)]">
                  <tr>
                    <th className="pb-2 font-medium">Exercise</th>
                    <th className="pb-2 text-right font-medium">Best</th>
                    <th className="pb-2 text-right font-medium">Latest</th>
                    <th className="pb-2 text-right font-medium">{range}-day change</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {withHistory.map((d) => {
                    const h = history[d.id];
                    const best = h.reduce((b, x) => (x.kg >= b.kg ? x : b));
                    const latest = h.at(-1)!;
                    const change = rangeChange(h);
                    return (
                      <tr
                        key={d.id}
                        onClick={() => setExerciseId(d.id)}
                        className={`cursor-pointer border-t border-[var(--border)] transition-colors hover:bg-[var(--card-hover)] ${
                          d.id === selected.id ? "bg-[var(--card-hover)]" : ""
                        }`}
                      >
                        <td className="py-2 pr-2">
                          <span className="flex items-center gap-2">
                            <ExerciseIcon icon={iconForExercise(d.name, d.muscle_group)} className="h-6 w-6 shrink-0 text-[var(--accent)]" />
                            <span className="truncate">{d.name}</span>
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <span className="font-semibold">{formatNumber(best.kg)} kg</span>
                          <span className="block text-[11px] text-[var(--muted)]">{formatShortDate(best.date)}</span>
                        </td>
                        <td className="py-2 text-right">
                          {formatNumber(latest.kg)} kg
                          <span className="block text-[11px] text-[var(--muted)]">{formatShortDate(latest.date)}</span>
                        </td>
                        <td className="py-2 text-right">
                          {change == null ? (
                            <span className="text-[var(--muted)]">—</span>
                          ) : (
                            <span className={change > 0 ? "text-[var(--accent)]" : change < 0 ? "text-red-400" : ""}>
                              {change > 0 ? "▲ " : change < 0 ? "▼ " : ""}
                              {signed(change)} kg
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Muscle groups */}
      <Card title="Muscle groups this week" subtitle="Exercises logged since Monday · grey tick = last week">
        {withHistory.length === 0 ? (
          <Empty>Log workouts to see which muscles you&apos;re training.</Empty>
        ) : (
          <ul className="space-y-2.5">
            {muscleRows.map(([muscle, c]) => (
              <li key={muscle} className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-3 text-sm">
                <span className={c.thisWeek ? "" : "text-[var(--muted)]"}>{muscle}</span>
                <span className="relative h-3 rounded-full bg-[var(--card-hover)]">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)]"
                    style={{ width: `${(c.thisWeek / muscleMax) * 100}%` }}
                  />
                  {c.lastWeek > 0 && (
                    <span
                      className="absolute -top-0.5 h-4 w-0.5 rounded-full bg-[var(--muted)]"
                      style={{ left: `calc(${(c.lastWeek / muscleMax) * 100}% - 1px)` }}
                      title={`Last week: ${c.lastWeek}`}
                    />
                  )}
                </span>
                <span className="text-right tabular-nums">
                  {c.thisWeek ? (
                    <span className="font-semibold">{c.thisWeek}</span>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">none</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Consistency */}
      <Card
        title="Training consistency"
        subtitle={`Last 13 weeks · ${calendarDays.filter((d) => trained.has(d)).length} workouts · ${(calendarDays.filter((d) => trained.has(d)).length / 13).toFixed(1)} per week`}
        action={
          <span className="rounded-lg bg-[var(--background)] px-2.5 py-1 text-xs">
            This week: <span className="font-semibold">{thisWeek}</span>
          </span>
        }
      >
        <TrainingCalendar days={calendarDays} trained={trained} />
      </Card>

      {/* Body weight */}
      <Card
        title="Body weight"
        subtitle={
          targetWeightKg != null && latestWeight
            ? `Target ${targetWeightKg} kg · ${formatNumber(Math.abs(latestWeight.value - targetWeightKg))} kg to go`
            : weightsInRange.length < 2 && weights.length >= 2
              ? "All time (not enough logs in this period)"
              : undefined
        }
      >
        <div className="space-y-4">
          {weightPoints.length >= 2 ? (
            <LineChart points={weightPoints} unit="kg" />
          ) : (
            <Empty>Log your weight on a couple of days to see the trend.</Empty>
          )}
          <AddBodyLogForm
            onAdded={(log) =>
              setBodyLogs((prev) =>
                [...prev.filter((l) => l.log_date !== log.log_date), log].sort((a, b) => a.log_date.localeCompare(b.log_date))
              )
            }
          />
        </div>
      </Card>
    </div>
  );
}
