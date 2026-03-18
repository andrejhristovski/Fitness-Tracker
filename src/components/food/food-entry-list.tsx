"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FoodEntry } from "@/types/database";

interface FoodEntryListProps {
  entries: FoodEntry[];
  onDeleted: (id: string) => void;
}

export function FoodEntryList({ entries, onDeleted }: FoodEntryListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("food_entries").delete().eq("id", id);
    onDeleted(id);
    setDeletingId(null);
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry) => {
        const cal = Math.round(entry.calories * entry.quantity);
        const p = (entry.protein * entry.quantity).toFixed(0);
        const c = (entry.carbs * entry.quantity).toFixed(0);
        const f = (entry.fats * entry.quantity).toFixed(0);
        return (
          <li
            key={entry.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 transition-colors hover:bg-[var(--card-hover)]"
          >
            <div>
              <p className="font-medium">{entry.name}</p>
              <p className="text-sm text-[var(--muted)]">
                {cal} kcal · Protein {p}g · Carbs {c}g · Fats {f}g
                {entry.quantity !== 1 && ` · ×${entry.quantity}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(entry.id)}
              disabled={deletingId === entry.id}
              className="rounded-lg px-2 py-1 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            >
              {deletingId === entry.id ? "…" : "Remove"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
