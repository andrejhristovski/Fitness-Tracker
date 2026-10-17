"use client";

import { useState } from "react";
import { saveBodyLog } from "@/app/actions/profile-actions";
import type { BodyLog } from "@/types/database";
import { localDate } from "@/lib/dates";

interface AddBodyLogFormProps {
  onAdded: (log: BodyLog) => void;
}

export function AddBodyLogForm({ onAdded }: AddBodyLogFormProps) {
  const [logDate, setLogDate] = useState(
    localDate()
  );
  const [weightKg, setWeightKg] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await saveBodyLog({
      log_date: logDate,
      weight_kg: weightKg ? Number(weightKg.replace(",", ".")) : null,
      notes: notes.trim() || null,
    });

    setLoading(false);
    if (result.ok) {
      onAdded(result.data);
      setWeightKg("");
      setNotes("");
      setLogDate(localDate());
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3"
    >
      <div>
        <label className="block text-xs text-[var(--muted)]">Date</label>
        <input
          type="date"
          value={logDate}
          onChange={(e) => setLogDate(e.target.value)}
          required
          className="mt-1 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm focus:border-[var(--accent)] focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs text-[var(--muted)]">Weight (kg)</label>
        <input
          type="number"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          placeholder="e.g. 75"
          min={0}
          step={0.1}
          className="mt-1 w-24 rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>
      <div className="min-w-[140px] flex-1">
        <label className="block text-xs text-[var(--muted)]">Notes</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional"
          className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1.5 text-sm placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
      >
        {loading ? "Saving…" : "Log"}
      </button>
    </form>
  );
}
