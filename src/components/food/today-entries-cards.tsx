"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FoodEntry } from "@/types/database";

interface TodayEntriesCardsProps {
  entries: FoodEntry[];
  onDeleted: (id: string) => void;
}

export function TodayEntriesCards({ entries, onDeleted }: TodayEntriesCardsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    await supabase.from("food_entries").delete().eq("id", id);
    onDeleted(id);
    setDeletingId(null);
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] border-dashed bg-[var(--card)]/50 p-10 text-center">
        <p className="text-[var(--muted)]">No meals logged today.</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Tap &quot;+ Add Meal&quot; to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:overflow-visible sm:grid-cols-2 lg:grid-cols-4">
      {entries.map((entry) => {
        const cal = Math.round(Number(entry.calories));
        const p = Number(entry.protein).toFixed(0);
        const c = Number(entry.carbs).toFixed(0);
        const f = Number(entry.fats).toFixed(0);
        const amountLabel =
          entry.quantity > 0 ? ` · ${entry.quantity}g` : "";

        const imgSrc = entry.image_path
          ? entry.image_path.includes(" ")
            ? entry.image_path.split("/").map(encodeURIComponent).join("/")
            : entry.image_path
          : null;

        return (
          <div
            key={entry.id}
            className="flex min-w-[200px] shrink-0 flex-col items-center sm:min-w-0"
          >
            <div className="relative z-10 size-24 overflow-hidden rounded-full border-2 border-[var(--card)] bg-[var(--background)] shadow-md sm:size-28">
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full bg-[var(--border)]" />
              )}
            </div>

            <div className="relative -mt-6 flex w-full flex-1 flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 pb-3 pt-10 shadow-sm transition-all hover:shadow-md">
              {/* Trash – top right absolute */}
              <div className="absolute right-2 top-2">
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                  className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                  aria-label="Remove"
                >
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <h4 className="text-center text-base font-semibold leading-tight text-[var(--foreground)] line-clamp-2">
                {entry.name}
              </h4>

              <p className="mt-1 text-center text-sm font-medium text-[var(--accent)]">
                {cal} kcal
                {amountLabel}
              </p>

              <p className="mt-0.5 text-center text-sm text-[var(--muted)]">
                Protein {p}g · Carbs {c}g · Fats {f}g
              </p>

              <div className="mt-3" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
