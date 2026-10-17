"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { EXERCISE_LIBRARY, MUSCLE_GROUPS, type MuscleGroup } from "@/lib/exercise-library";
import { ExerciseIcon } from "./exercise-icon";

interface ExerciseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Names shown as already added (not selectable). */
  disabledNames: Set<string>;
  title?: string;
  onAdd: (items: { name: string; muscle_group: string | null }[]) => Promise<boolean>;
}

export function ExerciseLibraryModal({ isOpen, onClose, disabledNames, title = "Add exercises", onAdd }: ExerciseLibraryModalProps) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customName, setCustomName] = useState("");
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>("Chest");
  const [saving, setSaving] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISE_LIBRARY.filter(
      (e) =>
        (!muscle || e.muscle === muscle) &&
        (!q || e.name.toLowerCase().includes(q) || e.equipment.toLowerCase().includes(q))
    );
  }, [query, muscle]);

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function close() {
    setSelected(new Set());
    setQuery("");
    setCustomName("");
    onClose();
  }

  async function add(items: { name: string; muscle_group: string | null }[]) {
    if (items.length === 0) return;
    setSaving(true);
    const ok = await onAdd(items);
    setSaving(false);
    if (ok) close();
  }

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
      active
        ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
        : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
    }`;

  return (
    <Modal isOpen={isOpen} onClose={close} title={title} size="lg">
      <div className="space-y-4">
        <input
          type="search"
          autoFocus
          placeholder="Search exercises or equipment…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
        />

        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(muscle === null)} onClick={() => setMuscle(null)}>
            All
          </button>
          {MUSCLE_GROUPS.map((m) => (
            <button key={m} type="button" className={chip(muscle === m)} onClick={() => setMuscle(m)}>
              {m}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {results.map((e) => {
            const saved = disabledNames.has(e.name.toLowerCase());
            const isSelected = selected.has(e.name);
            return (
              <button
                key={e.name}
                type="button"
                disabled={saved}
                onClick={() => toggle(e.name)}
                className={`relative flex flex-col items-center rounded-xl border p-3 text-center transition-colors disabled:opacity-40 ${
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--accent)]/40"
                }`}
              >
                {(isSelected || saved) && (
                  <span className="absolute right-2 top-2 text-xs text-[var(--accent)]">✓</span>
                )}
                <ExerciseIcon
                  icon={e.icon}
                  className={`h-12 w-12 ${isSelected ? "text-[var(--accent)]" : "text-[var(--foreground)]/80"}`}
                />
                <span className="mt-2 text-sm font-medium leading-tight">{e.name}</span>
                <span className="mt-0.5 text-[11px] text-[var(--muted)]">
                  {saved ? "Added" : `${e.muscle} · ${e.equipment}`}
                </span>
              </button>
            );
          })}
        </div>
        {results.length === 0 && (
          <p className="py-4 text-center text-sm text-[var(--muted)]">
            Not in the library — add it as a custom exercise below.
          </p>
        )}

        <div className="rounded-xl border border-dashed border-[var(--border)] p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Custom exercise
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              placeholder="Name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
            <select
              value={customMuscle}
              onChange={(e) => setCustomMuscle(e.target.value as MuscleGroup)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              {MUSCLE_GROUPS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={!customName.trim() || saving}
              onClick={() => add([{ name: customName, muscle_group: customMuscle }])}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--card-hover)] disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>

        <div className="sticky -bottom-4 -mx-5 -mb-4 border-t border-[var(--border)] bg-[var(--card)] px-5 py-3">
          <button
            type="button"
            disabled={selected.size === 0 || saving}
            onClick={() =>
              add(
                EXERCISE_LIBRARY.filter((e) => selected.has(e.name)).map((e) => ({
                  name: e.name,
                  muscle_group: e.muscle,
                }))
              )
            }
            className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold text-[var(--on-accent)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40"
          >
            {saving ? "Adding…" : selected.size ? `Add ${selected.size} exercise${selected.size > 1 ? "s" : ""}` : "Select exercises"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
