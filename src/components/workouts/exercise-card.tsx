"use client";

import { useState } from "react";
import type { ExerciseDefinition } from "@/types/database";
import type { MaxLog } from "@/app/actions/workout-actions";
import { iconForExercise } from "@/lib/exercise-library";
import { ExerciseIcon } from "./exercise-icon";

interface ExerciseCardProps {
  definition: ExerciseDefinition;
  history: MaxLog[];
  today: string;
  onSave: (kg: number | null) => Promise<boolean>;
  onOpen: () => void;
}

export function formatKg(kg: number) {
  return `${Number.isInteger(kg) ? kg : kg.toFixed(1)} kg`;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <div className="h-7" />;
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${24 - ((v - min) / range) * 20}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="h-7 w-full" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function ExerciseCard({ definition, history, today, onSave, onOpen }: ExerciseCardProps) {
  const todayLog = history.find((h) => h.date === today);
  const previous = [...history].reverse().find((h) => h.date < today);
  const best = history.length ? Math.max(...history.map((h) => h.kg)) : null;

  const [value, setValue] = useState(todayLog ? String(todayLog.kg) : "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  async function commit() {
    const trimmed = value.trim().replace(",", ".");
    const kg = trimmed === "" ? null : Number(trimmed);
    if (kg !== null && (!Number.isFinite(kg) || kg < 0)) {
      setStatus("error");
      return;
    }
    if (kg === (todayLog?.kg ?? null)) return;
    setStatus("saving");
    const ok = await onSave(kg);
    setStatus(ok ? "idle" : "error");
  }

  const delta = todayLog && previous ? todayLog.kg - previous.kg : null;
  const earlier = history.filter((h) => h.date !== today).map((h) => h.kg);
  const isPR = todayLog != null && earlier.length > 0 && todayLog.kg > Math.max(...earlier);

  return (
    <div className="group flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--accent)]/40">
      <button type="button" onClick={onOpen} className="flex items-center gap-3 text-left">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
          <ExerciseIcon icon={iconForExercise(definition.name, definition.muscle_group)} className="h-11 w-11" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-semibold leading-tight">{definition.name}</h3>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            {definition.muscle_group ?? "Other"}
            {best != null && <> · Best {formatKg(best)}</>}
          </p>
        </div>
      </button>

      <div className="mt-3">
        <Sparkline values={history.slice(-12).map((h) => h.kg)} />
      </div>

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          (document.activeElement as HTMLElement | null)?.blur();
        }}
      >
        <div
          className={`flex flex-1 items-center rounded-xl border bg-[var(--background)] pr-3 transition-colors focus-within:border-[var(--accent)] ${
            status === "error" ? "border-red-500" : todayLog ? "border-[var(--accent)]/50" : "border-[var(--border)]"
          }`}
        >
          <input
            type="text"
            inputMode="decimal"
            placeholder={previous ? `Last ${previous.kg}` : "Today's max"}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            onBlur={commit}
            aria-label={`${definition.name} max kg today`}
            className="w-full min-w-0 bg-transparent px-3 py-2.5 text-lg font-semibold tabular-nums outline-none placeholder:text-sm placeholder:font-normal placeholder:text-[var(--muted)]"
          />
          <span className="text-sm text-[var(--muted)]">kg</span>
        </div>
        <div className="w-14 text-right text-xs font-medium tabular-nums">
          {status === "saving" ? (
            <span className="text-[var(--muted)]">Saving…</span>
          ) : status === "error" ? (
            <span className="text-red-400">Error</span>
          ) : isPR ? (
            <span className="rounded-md bg-[var(--accent)]/15 px-1.5 py-0.5 text-[var(--accent)]">PR</span>
          ) : delta != null && delta !== 0 ? (
            <span className={delta > 0 ? "text-[var(--accent)]" : "text-red-400"}>
              {delta > 0 ? "+" : ""}
              {Number.isInteger(delta) ? delta : delta.toFixed(1)}
            </span>
          ) : todayLog ? (
            <span className="text-[var(--accent)]">✓</span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
