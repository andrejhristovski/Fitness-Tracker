"use client";

import { useMemo, useState } from "react";
import type { ExerciseDefinition } from "@/types/database";
import {
  addExercises,
  createDayPlans,
  deleteDayPlan,
  deleteExerciseDefinition,
  logDailyMax,
  updateDayPlan,
  type DayPlan,
  type MaxLog,
} from "@/app/actions/workout-actions";
import { localDate } from "@/lib/dates";
import { EXERCISE_LIBRARY, MUSCLE_GROUPS, PRESET_DAYS, findLibraryExercise } from "@/lib/exercise-library";
import { ExerciseCard } from "./exercise-card";
import { ExerciseLibraryModal } from "./exercise-library-modal";
import { ExerciseHistoryModal } from "./exercise-history-modal";
import { DayPlanModal } from "./day-plan-modal";

interface WorkoutsTabProps {
  initialDefinitions: ExerciseDefinition[];
  initialHistory: Record<string, MaxLog[]>;
  initialPlans: DayPlan[];
}

const ALL = "all";

function withLog(history: MaxLog[], date: string, kg: number | null): MaxLog[] {
  const rest = history.filter((h) => h.date !== date);
  return kg == null ? rest : [...rest, { date, kg }].sort((a, b) => a.date.localeCompare(b.date));
}

/** Most recent date any exercise in the day was logged. */
function lastTrained(plan: DayPlan, history: Record<string, MaxLog[]>): string | null {
  let last: string | null = null;
  for (const id of plan.exerciseIds) {
    const d = history[id]?.at(-1)?.date;
    if (d && (!last || d > last)) last = d;
  }
  return last;
}

/** Today's day if already started, otherwise the one after the most recently trained (rotation). */
function suggestDay(plans: DayPlan[], history: Record<string, MaxLog[]>, today: string): string | null {
  if (plans.length === 0) return null;
  const last = plans.map((p) => lastTrained(p, history));
  const todayIdx = last.indexOf(today);
  if (todayIdx >= 0) return plans[todayIdx].id;
  let recent = -1;
  last.forEach((d, i) => {
    if (d && (recent < 0 || d > last[recent]!)) recent = i;
  });
  return plans[(recent + 1) % plans.length].id;
}

function daysAgo(date: string, today: string) {
  const diff = Math.round((Date.parse(today) - Date.parse(date)) / 86_400_000);
  return diff === 0 ? "Today" : diff === 1 ? "Yesterday" : `${diff} days ago`;
}

export function WorkoutsTab({ initialDefinitions, initialHistory, initialPlans }: WorkoutsTabProps) {
  const [today] = useState(localDate);
  const [definitions, setDefinitions] = useState(initialDefinitions);
  const [history, setHistory] = useState(initialHistory);
  const [plans, setPlans] = useState(initialPlans);
  const [suggested] = useState(() => suggestDay(initialPlans, initialHistory, today));
  const [selected, setSelected] = useState<string>(suggested ?? ALL);
  const [muscle, setMuscle] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [dayModal, setDayModal] = useState<"new" | "edit" | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = plans.find((p) => p.id === selected) ?? null;
  const byId = useMemo(() => new Map(definitions.map((d) => [d.id, d])), [definitions]);

  const groups = useMemo(() => {
    const present = new Set(definitions.map((d) => d.muscle_group ?? "Other"));
    return [...MUSCLE_GROUPS, "Other"].filter((g) => present.has(g));
  }, [definitions]);

  const visible = plan
    ? plan.exerciseIds.map((id) => byId.get(id)).filter((d): d is ExerciseDefinition => !!d)
    : definitions.filter((d) => !muscle || (d.muscle_group ?? "Other") === muscle);
  const loggedToday = visible.filter((d) => history[d.id]?.some((h) => h.date === today)).length;
  const openDefinition = definitions.find((d) => d.id === openId) ?? null;

  async function saveLog(definition: ExerciseDefinition, date: string, kg: number | null) {
    const result = await logDailyMax({ id: definition.id, name: definition.name }, date, kg);
    if (!result.ok) setError(result.error);
    if (result.ok) {
      setHistory((prev) => ({ ...prev, [definition.id]: withLog(prev[definition.id] ?? [], date, kg) }));
    }
    return result.ok;
  }

  async function handleAdd(items: { name: string; muscle_group: string | null }[]) {
    const result = await addExercises(items, plan?.id ?? null);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setDefinitions((prev) => [...prev, ...result.created]);
    if (plan && result.planExerciseIds) {
      const ids = result.planExerciseIds;
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, exerciseIds: ids } : p)));
    }
    return true;
  }

  async function handleRemove(id: string) {
    const result = await deleteExerciseDefinition(id);
    if (!result.ok) setError(result.error);
    if (result.ok) {
      setDefinitions((prev) => prev.filter((d) => d.id !== id));
      setPlans((prev) => prev.map((p) => ({ ...p, exerciseIds: p.exerciseIds.filter((x) => x !== id) })));
      setOpenId(null);
    }
  }

  async function createPresets(presets: typeof PRESET_DAYS) {
    setBusy(true);
    try {
      const result = await createDayPlans(
        presets.map((p) => ({
          name: p.name,
          items: p.exercises.map((name) => ({ name, muscle_group: findLibraryExercise(name)?.muscle ?? null })),
        }))
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDefinitions((prev) => [...prev, ...result.created]);
      setPlans((prev) => [...prev, ...result.plans]);
      setSelected((cur) => (cur === ALL && result.plans[0] ? result.plans[0].id : cur));
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveDay(name: string, exerciseIds: string[]) {
    if (dayModal === "edit" && plan) {
      const result = await updateDayPlan(plan.id, name, exerciseIds);
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, name: name.trim(), exerciseIds } : p)));
    } else {
      const items = exerciseIds
        .map((id) => byId.get(id))
        .filter((d): d is ExerciseDefinition => !!d)
        .map((d) => ({ name: d.name, muscle_group: d.muscle_group }));
      const result = await createDayPlans([{ name, items }]);
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      setPlans((prev) => [...prev, ...result.plans]);
      setSelected(result.plans[0].id);
    }
    setDayModal(null);
    return true;
  }

  async function handleDeleteDay() {
    if (!plan) return;
    const result = await deleteDayPlan(plan.id);
    if (!result.ok) setError(result.error);
    if (result.ok) {
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      setSelected(ALL);
      setDayModal(null);
    }
  }

  const dateLabel = new Date(`${today}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
      active
        ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
        : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
    }`;

  const missingPresets = PRESET_DAYS.filter(
    (p) => !plans.some((plan) => plan.name.toLowerCase() === p.name.toLowerCase())
  );

  const disabledNames = new Set(
    (plan ? visible : definitions).map((d) => d.name.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workouts</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{dateLabel}</p>
      </div>

      {error && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <span>Couldn&apos;t save: {error}</span>
          <button type="button" onClick={() => setError(null)} className="text-red-300/70 hover:text-red-200" aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {/* Day picker */}
      {plans.length === 0 ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="font-semibold">Set up your split</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Group exercises into workout days. Each day, pick the day and type your max kg.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {PRESET_DAYS.map((p) => (
              <button
                key={p.name}
                type="button"
                disabled={busy}
                onClick={() => createPresets([p])}
                className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-left transition-colors hover:border-[var(--accent)]/50 disabled:opacity-50"
              >
                <p className="font-semibold">{p.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{p.exercises.join(" · ")}</p>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => createPresets(PRESET_DAYS)}
              className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {busy ? "Creating…" : "Create all 3 days"}
            </button>
            <button
              type="button"
              onClick={() => setDayModal("new")}
              className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--card-hover)]"
            >
              Custom day
            </button>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {plans.map((p) => {
            const last = lastTrained(p, history);
            const active = p.id === selected;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(p.id)}
                className={`rounded-2xl border p-3 text-left transition-colors ${
                  active
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)]/40"
                }`}
              >
                <p className={`truncate font-semibold ${active ? "text-[var(--accent)]" : ""}`}>{p.name}</p>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  {p.id === suggested && last !== today ? (
                    <span className="text-[var(--accent)]">Up next</span>
                  ) : last ? (
                    daysAgo(last, today)
                  ) : (
                    `${p.exerciseIds.length} exercises`
                  )}
                </p>
              </button>
            );
          })}
          {missingPresets.map((p) => (
            <button
              key={p.name}
              type="button"
              disabled={busy}
              onClick={() => createPresets([p])}
              className="rounded-2xl border border-dashed border-[var(--border)] p-3 text-left text-[var(--muted)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--foreground)] disabled:opacity-50"
            >
              <p className="truncate font-semibold">+ {p.name}</p>
              <p className="mt-0.5 text-xs">{busy ? "Creating…" : `${p.exercises.length} exercises`}</p>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelected(ALL)}
            className={`rounded-2xl border p-3 text-left transition-colors ${
              selected === ALL
                ? "border-[var(--accent)] bg-[var(--accent)]/10"
                : "border-dashed border-[var(--border)] hover:border-[var(--accent)]/40"
            }`}
          >
            <p className={`font-semibold ${selected === ALL ? "text-[var(--accent)]" : ""}`}>All exercises</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">{definitions.length} total</p>
          </button>
        </section>
      )}

      {/* Selected day toolbar */}
      {(plans.length > 0 || definitions.length > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{plan ? plan.name : "All exercises"}</h2>
            {visible.length > 0 && (
              <p className={`text-xs ${loggedToday ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                {loggedToday}/{visible.length} logged today
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {plan ? (
              <button
                type="button"
                onClick={() => setDayModal("edit")}
                className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--card-hover)]"
              >
                Edit day
              </button>
            ) : (
              plans.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDayModal("new")}
                  className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--card-hover)]"
                >
                  New day
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => setLibraryOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              <span className="text-base leading-none">+</span> Add exercise
            </button>
          </div>
        </div>
      )}

      {!plan && groups.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {[null, ...groups].map((g) => (
            <button key={g ?? "all"} type="button" onClick={() => setMuscle(g)} className={chip(muscle === g)}>
              {g ?? "All"}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        (plan || definitions.length > 0) && (
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className="w-full rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)]/50 px-6 py-12 text-center transition-colors hover:border-[var(--accent)]/50"
          >
            <p className="font-semibold">No exercises in this day</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Add from the library ({EXERCISE_LIBRARY.length} exercises) or create your own.
            </p>
          </button>
        )
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((d) => {
            const h = history[d.id] ?? [];
            return (
              <ExerciseCard
                key={`${d.id}-${h.find((x) => x.date === today)?.kg ?? ""}`}
                definition={d}
                history={h}
                today={today}
                onSave={(kg) => saveLog(d, today, kg)}
                onOpen={() => setOpenId(d.id)}
              />
            );
          })}
        </div>
      )}

      <ExerciseLibraryModal
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        title={plan ? `Add to ${plan.name}` : "Add exercises"}
        disabledNames={disabledNames}
        onAdd={handleAdd}
      />
      <DayPlanModal
        isOpen={dayModal !== null}
        plan={dayModal === "edit" ? plan : null}
        definitions={definitions}
        onClose={() => setDayModal(null)}
        onSave={handleSaveDay}
        onDelete={handleDeleteDay}
      />
      <ExerciseHistoryModal
        definition={openDefinition}
        history={openDefinition ? history[openDefinition.id] ?? [] : []}
        onClose={() => setOpenId(null)}
        onDeleteLog={(date) => openDefinition && saveLog(openDefinition, date, null)}
        onRemove={() => openDefinition && handleRemove(openDefinition.id)}
      />
    </div>
  );
}
