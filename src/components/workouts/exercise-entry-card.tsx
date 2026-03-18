"use client";

import { useState } from "react";
import type { ExerciseEntry } from "@/types/database";
import { updateExerciseEntry } from "@/app/actions/workout-actions";

interface ExerciseEntryCardProps {
  entry: ExerciseEntry;
  latestWeight: number | null;
  maxWeight: number | null;
  onUpdated: (entry: ExerciseEntry) => void;
  onDeleted: (id: string) => void;
}

export function ExerciseEntryCard({
  entry,
  latestWeight,
  maxWeight,
  onUpdated,
  onDeleted,
}: ExerciseEntryCardProps) {
  const [sets, setSets] = useState(String(entry.sets));
  const [reps, setReps] = useState(entry.reps != null ? String(entry.reps) : "");
  const [weightKg, setWeightKg] = useState(
    entry.weight_kg != null ? String(entry.weight_kg) : ""
  );
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasChanges =
    Number(sets) !== entry.sets ||
    (reps === "" ? null : Number(reps)) !== entry.reps ||
    (weightKg === "" ? null : Number(weightKg)) !== entry.weight_kg ||
    notes !== (entry.notes ?? "");

  async function handleSave() {
    if (!hasChanges) return;
    setSaving(true);
    const result = await updateExerciseEntry(entry.id, {
      sets: Number(sets) || 0,
      reps: reps === "" ? null : Number(reps),
      weight_kg: weightKg === "" ? null : Number(weightKg),
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (result.ok) onUpdated(result.data);
  }

  async function handleDelete() {
    if (!confirm("Remove this exercise from the session?")) return;
    setDeleting(true);
    const supabase = (await import("@/lib/supabase/client")).createClient();
    await supabase.from("exercise_entries").delete().eq("id", entry.id);
    onDeleted(entry.id);
    setDeleting(false);
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-[var(--foreground)]">{entry.name}</h4>
          {(latestWeight != null || maxWeight != null) && (
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              {latestWeight != null && `Latest: ${latestWeight} kg`}
              {latestWeight != null && maxWeight != null && " · "}
              {maxWeight != null && `Best: ${maxWeight} kg`}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          {hasChanges && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-[var(--accent)] px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              {saving ? "Save…" : "Save"}
            </button>
          )}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg p-1 text-[var(--muted)] transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
            aria-label="Remove"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        <div>
          <label className="block text-xs text-[var(--muted)]">Sets</label>
          <input
            type="number"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            min={0}
            className="mt-0.5 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)]">Reps</label>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            min={0}
            placeholder="—"
            className="mt-0.5 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--muted)]">Weight (kg)</label>
          <input
            type="number"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            min={0}
            step={0.5}
            placeholder="—"
            className="mt-0.5 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div className="col-span-3 sm:col-span-1">
          <label className="block text-xs text-[var(--muted)]">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
            className="mt-0.5 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
