"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ExerciseEntry } from "@/types/database";

interface AddExerciseFormProps {
  sessionId: string;
  onAdded: (entry: ExerciseEntry) => void;
}

export function AddExerciseForm({ sessionId, onAdded }: AddExerciseFormProps) {
  const [name, setName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data: existing } = await supabase
      .from("exercise_entries")
      .select("sort_order")
      .eq("session_id", sessionId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single();

    const sortOrder = (existing?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from("exercise_entries")
      .insert({
        session_id: sessionId,
        name: name.trim(),
        sets: Number(sets) || 0,
        reps: reps ? Number(reps) : null,
        weight_kg: weightKg ? Number(weightKg) : null,
        notes: notes.trim() || null,
        sort_order: sortOrder,
      })
      .select()
      .single();

    setLoading(false);
    if (error) return;
    if (data) {
      onAdded(data);
      setName("");
      setSets("");
      setReps("");
      setWeightKg("");
      setNotes("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <p className="text-xs font-medium text-[var(--muted)]">Add exercise</p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Exercise name"
        required
        className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input
          type="number"
          value={sets}
          onChange={(e) => setSets(e.target.value)}
          placeholder="Sets"
          min={0}
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        />
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="Reps"
          min={0}
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        />
        <input
          type="number"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          placeholder="Weight (kg)"
          min={0}
          step={0.5}
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        />
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none sm:col-span-1"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-fit rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--card-hover)] disabled:opacity-50"
      >
        {loading ? "Adding…" : "Add exercise"}
      </button>
    </form>
  );
}
