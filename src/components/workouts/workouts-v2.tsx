"use client";

import { useState } from "react";
import type { ExerciseDefinition } from "@/types/database";
import type { MaxLog } from "@/app/actions/workout-actions";
import { lastTrained } from "@/lib/workout-plan";
import { daysBetween } from "@/lib/dates";
import { EXERCISE_LIBRARY, PRESET_DAYS, iconForExercise } from "@/lib/exercise-library";
import { ALL, daysAgo, useWorkouts, type WorkoutsData } from "./use-workouts";
import { formatKg } from "./exercise-card";
import { ExerciseIcon } from "./exercise-icon";
import { ExerciseLibraryModal } from "./exercise-library-modal";
import { ExerciseHistoryModal } from "./exercise-history-modal";
import { DayPlanModal } from "./day-plan-modal";

const chip = (active: boolean) =>
  `shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
    active
      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]"
      : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]"
  }`;

function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border)" strokeWidth={6} />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">
        {done}/{total}
      </span>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${22 - ((v - min) / range) * 18}`).join(" ");
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-6 w-full" aria-hidden="true">
      <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

interface RowProps {
  definition: ExerciseDefinition;
  history: MaxLog[];
  today: string;
  expanded: boolean;
  onToggle: () => void;
  onSave: (kg: number | null) => Promise<boolean>;
  onOpen: () => void;
  /** Enter / Go on the keyboard: save and move on to the next exercise. */
  onNext: () => void;
}

function ExerciseRow({ definition, history, today, expanded, onToggle, onSave, onOpen, onNext }: RowProps) {
  const todayLog = history.find((h) => h.date === today);
  const previous = [...history].reverse().find((h) => h.date < today);
  const earlier = history.filter((h) => h.date !== today).map((h) => h.kg);
  const best = history.length ? Math.max(...history.map((h) => h.kg)) : null;
  const isPR = todayLog != null && earlier.length > 0 && todayLog.kg > Math.max(...earlier);
  const delta = todayLog && previous ? todayLog.kg - previous.kg : null;

  const [value, setValue] = useState(todayLog ? String(todayLog.kg) : "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  async function save(kg: number | null) {
    if (kg !== null && (!Number.isFinite(kg) || kg < 0)) {
      setStatus("error");
      return false;
    }
    if (kg === (todayLog?.kg ?? null)) return true;
    setValue(kg == null ? "" : String(kg));
    setStatus("saving");
    const ok = await onSave(kg);
    setStatus(ok ? "idle" : "error");
    return ok;
  }

  const commit = () => {
    const t = value.trim().replace(",", ".");
    return save(t === "" ? null : Number(t));
  };

  const base = Number(value.replace(",", ".")) || todayLog?.kg || previous?.kg || 0;
  const ago = previous ? daysBetween(previous.date, today) : null;

  return (
    <div
      className={`rounded-2xl border bg-[var(--card)] transition-colors ${
        expanded ? "border-[var(--accent)]/50" : todayLog ? "border-[var(--accent)]/25" : "border-[var(--border)]"
      }`}
    >
      <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex w-full items-center gap-3 p-3 text-left">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            todayLog ? "bg-[var(--accent)] text-[var(--on-accent)]" : "bg-[var(--accent)]/10 text-[var(--accent)]"
          }`}
        >
          {todayLog ? (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          ) : (
            <ExerciseIcon icon={iconForExercise(definition.name, definition.muscle_group)} className="h-8 w-8" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{definition.name}</p>
          <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
            {previous ? (
              <>
                Last {formatKg(previous.kg)} · {ago === 1 ? "yesterday" : `${ago}d ago`}
              </>
            ) : (
              definition.muscle_group ?? "New exercise"
            )}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {todayLog ? (
            <>
              <p className="text-lg font-bold tabular-nums leading-none">
                {fmt(todayLog.kg)}
                <span className="ml-0.5 text-xs font-medium text-[var(--muted)]">kg</span>
              </p>
              {isPR ? (
                <span className="mt-1 inline-block rounded-md bg-[var(--accent)]/15 px-1.5 py-0.5 text-[10px] font-bold text-[var(--accent)]">PR</span>
              ) : delta != null && delta !== 0 ? (
                <span className={`mt-1 inline-block text-xs font-semibold ${delta > 0 ? "text-[var(--accent)]" : "text-red-400"}`}>
                  {delta > 0 ? "+" : ""}
                  {fmt(delta)}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-sm font-medium text-[var(--muted)]">{expanded ? "" : "Log"}</span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] px-3 pt-3 pb-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <button
              type="button"
              onClick={() => save(Math.max(0, base - 2.5))}
              className="h-12 w-12 rounded-xl border border-[var(--border)] text-lg font-semibold transition-colors hover:bg-[var(--card-hover)]"
              aria-label="Minus 2.5 kg"
            >
              −
            </button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                commit().then((ok) => ok && onNext());
              }}
              className={`flex h-12 items-center rounded-xl border bg-[var(--background)] pr-3 focus-within:border-[var(--accent)] ${
                status === "error" ? "border-red-500" : "border-[var(--border)]"
              }`}
            >
              <input
                type="text"
                inputMode="decimal"
                placeholder={previous ? fmt(previous.kg) : "Max kg"}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                onBlur={commit}
                aria-label={`${definition.name} max kg today`}
                className="w-full min-w-0 bg-transparent px-3 text-center text-xl font-bold tabular-nums outline-none placeholder:font-normal placeholder:text-[var(--muted)]"
              />
              <span className="text-sm text-[var(--muted)]">kg</span>
            </form>
            <button
              type="button"
              onClick={() => save(base + 2.5)}
              className="h-12 w-12 rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)]/10 text-lg font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/20"
              aria-label="Plus 2.5 kg"
            >
              +
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            {previous && !todayLog && (
              <button
                type="button"
                onClick={() => save(previous.kg)}
                className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--on-accent)] transition-colors hover:bg-[var(--accent-hover)]"
              >
                Same as last ({formatKg(previous.kg)})
              </button>
            )}
            <span className="text-xs text-[var(--muted)]">
              {status === "saving" ? "Saving…" : status === "error" ? <span className="text-red-400">Couldn&apos;t save</span> : best != null ? `Best ${formatKg(best)}` : ""}
            </span>
            <button type="button" onClick={onOpen} className="ml-auto text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)]">
              History ›
            </button>
          </div>
          {history.length >= 2 && (
            <div className="mt-2">
              <Sparkline values={history.slice(-12).map((h) => h.kg)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function WorkoutsV2(props: WorkoutsData) {
  const w = useWorkouts(props);
  const { today, plans, plan, visible, history, loggedToday } = w;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const dateLabel = new Date(`${today}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  const last = plan ? lastTrained(plan, history) : null;
  const allDone = visible.length > 0 && loggedToday === visible.length;

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-24">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{dateLabel}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Workouts</h1>
        </div>
        {plans.length > 0 && (
          <button
            type="button"
            onClick={() => w.setDayModal(plan ? "edit" : "new")}
            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            {plan ? "Edit day" : "New day"}
          </button>
        )}
      </div>

      {w.error && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <span>Couldn&apos;t save: {w.error}</span>
          <button type="button" onClick={() => w.setError(null)} className="text-red-300/70 hover:text-red-200" aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {plans.length === 0 ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-lg font-semibold">Set up your split</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Pick your workout days. Then each day just type your max kg.</p>
          <div className="mt-4 space-y-2">
            {PRESET_DAYS.map((p) => (
              <button
                key={p.name}
                type="button"
                disabled={w.busy}
                onClick={() => w.createPresets([p])}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3 text-left transition-colors hover:border-[var(--accent)]/50 disabled:opacity-50"
              >
                <p className="font-semibold">{p.name}</p>
                <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{p.exercises.join(" · ")}</p>
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={w.busy}
              onClick={() => w.createPresets(PRESET_DAYS)}
              className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--on-accent)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {w.busy ? "Creating…" : "Create all 3 days"}
            </button>
            <button
              type="button"
              onClick={() => w.setDayModal("new")}
              className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium transition-colors hover:bg-[var(--card-hover)]"
            >
              Custom
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* Day switcher */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {plans.map((p) => (
              <button key={p.id} type="button" onClick={() => w.setSelected(p.id)} className={chip(p.id === w.selected)}>
                {p.name}
                {p.id === w.suggested && p.id !== w.selected && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent)] align-middle" />}
              </button>
            ))}
            <button type="button" onClick={() => w.setSelected(ALL)} className={chip(w.selected === ALL)}>
              All
            </button>
            {w.missingPresets.map((p) => (
              <button
                key={p.name}
                type="button"
                disabled={w.busy}
                onClick={() => w.createPresets([p])}
                className="shrink-0 rounded-full border border-dashed border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] disabled:opacity-50"
              >
                + {p.name}
              </button>
            ))}
          </div>

          {/* Hero */}
          {plan ? (
            <section
              className={`flex items-center gap-4 rounded-3xl border p-4 ${
                allDone ? "border-[var(--accent)]/60 bg-[var(--accent)]/10" : "border-[var(--border)] bg-[var(--card)]"
              }`}
            >
              <ProgressRing done={loggedToday} total={visible.length} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                  {allDone ? "Workout complete" : last === today ? "In progress" : plan.id === w.suggested ? "Up next" : "Workout day"}
                </p>
                <h2 className="truncate text-xl font-bold">{plan.name}</h2>
                <p className="text-xs text-[var(--muted)]">
                  {visible.length} exercises{last && last !== today ? ` · last done ${daysAgo(last, today).toLowerCase()}` : ""}
                </p>
              </div>
            </section>
          ) : (
            w.groups.length > 1 && (
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {[null, ...w.groups].map((g) => (
                  <button
                    key={g ?? "all"}
                    type="button"
                    onClick={() => w.setMuscle(g)}
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
                      w.muscle === g ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)]"
                    }`}
                  >
                    {g ?? "All muscles"}
                  </button>
                ))}
              </div>
            )
          )}
        </>
      )}

      {(plans.length > 0 || w.definitions.length > 0) &&
        (visible.length === 0 ? (
          <button
            type="button"
            onClick={() => w.setLibraryOpen(true)}
            className="w-full rounded-2xl border border-dashed border-[var(--border)] px-6 py-10 text-center transition-colors hover:border-[var(--accent)]/50"
          >
            <p className="font-semibold">No exercises yet</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Add from the library ({EXERCISE_LIBRARY.length} exercises) or create your own.</p>
          </button>
        ) : (
          <div className="space-y-2">
            {visible.map((d) => {
              const h = history[d.id] ?? [];
              return (
                <ExerciseRow
                  key={`${d.id}-${h.find((x) => x.date === today)?.kg ?? ""}`}
                  definition={d}
                  history={h}
                  today={today}
                  expanded={expandedId === d.id}
                  onToggle={() => setExpandedId((cur) => (cur === d.id ? null : d.id))}
                  onSave={(kg) => w.saveLog(d, today, kg)}
                  onOpen={() => w.setOpenId(d.id)}
                  onNext={() => {
                    const next = visible.find((x) => x.id !== d.id && !history[x.id]?.some((l) => l.date === today));
                    setExpandedId(next?.id ?? null);
                  }}
                />
              );
            })}
          </div>
        ))}

      {(plans.length > 0 || w.definitions.length > 0) && (
        <button
          type="button"
          onClick={() => w.setLibraryOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border)] py-3 text-sm font-medium text-[var(--muted)] transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
        >
          <span className="text-lg leading-none">+</span> Add exercise
        </button>
      )}

      <ExerciseLibraryModal
        isOpen={w.libraryOpen}
        onClose={() => w.setLibraryOpen(false)}
        title={plan ? `Add to ${plan.name}` : "Add exercises"}
        disabledNames={w.disabledNames}
        onAdd={w.handleAdd}
      />
      <DayPlanModal
        isOpen={w.dayModal !== null}
        plan={w.dayModal === "edit" ? plan : null}
        definitions={w.definitions}
        onClose={() => w.setDayModal(null)}
        onSave={w.handleSaveDay}
        onDelete={w.handleDeleteDay}
      />
      <ExerciseHistoryModal
        definition={w.openDefinition}
        history={w.openDefinition ? history[w.openDefinition.id] ?? [] : []}
        onClose={() => w.setOpenId(null)}
        onDeleteLog={(date) => w.openDefinition && w.saveLog(w.openDefinition, date, null)}
        onRemove={() => w.openDefinition && w.handleRemove(w.openDefinition.id)}
      />
    </div>
  );
}
