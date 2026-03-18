"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Food } from "@/types/database";

interface FrequentFoodCardsProps {
  foods: Food[];
  onAddClick: (food: Food) => void;
  onQuickAddToggle: (food: Food) => void;
}

export function FrequentFoodCards({
  foods,
  onAddClick,
  onQuickAddToggle,
}: FrequentFoodCardsProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleStarClick(e: React.MouseEvent, food: Food) {
    e.preventDefault();
    e.stopPropagation();
    setTogglingId(food.id);
    const supabase = createClient();
    await supabase
      .from("foods")
      .update({
        is_quick_add: !food.is_quick_add,
        quick_add_amount: !food.is_quick_add ? food.base_amount : null,
      })
      .eq("id", food.id);
    onQuickAddToggle({ ...food, is_quick_add: !food.is_quick_add, quick_add_amount: !food.is_quick_add ? food.base_amount : null });
    setTogglingId(null);
  }

  if (foods.length === 0) {
    return (
      <p className="rounded-2xl border border-[var(--border)] border-dashed bg-[var(--card)]/50 px-5 py-8 text-center text-sm text-[var(--muted)]">
        No food types yet. Create one to log by amount (e.g. grams).
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {foods.map((food) => (
        <div
          key={food.id}
          className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm transition-all hover:border-[var(--border)] hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-[var(--foreground)]">{food.name}</h4>
              <p className="mt-1 text-sm text-[var(--muted)]">
                per {food.base_amount}{food.base_unit}: {food.calories} kcal · Protein {food.protein}g · Carbs {food.carbs}g · Fats {food.fats}g
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => handleStarClick(e, food)}
              disabled={togglingId === food.id}
              className="shrink-0 rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--card-hover)] hover:text-[var(--accent)] disabled:opacity-50"
              aria-label={food.is_quick_add ? "Remove from most used" : "Add to most used"}
              title={food.is_quick_add ? "Remove from most used" : "Add to most used"}
            >
              <svg
                className="h-5 w-5"
                fill={food.is_quick_add ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={() => onAddClick(food)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-2.5 font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/20"
          >
            <span className="text-lg">+</span> Log
          </button>
        </div>
      ))}
    </div>
  );
}
