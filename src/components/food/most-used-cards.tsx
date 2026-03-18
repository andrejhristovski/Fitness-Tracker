"use client";

import type { Food } from "@/types/database";
import { calculateNutrition } from "@/lib/food-utils";

interface MostUsedCardsProps {
  foods: Food[];
  onAddClick: (food: Food, defaultAmount: number) => void;
  onEdit?: (food: Food) => void;
  onRemove?: (food: Food) => void;
}

export function MostUsedCards({
  foods,
  onAddClick,
  onEdit,
  onRemove,
}: MostUsedCardsProps) {
  if (foods.length === 0) {
    return (
      <p className="rounded-2xl border border-[var(--border)] border-dashed bg-[var(--card)]/50 px-5 py-6 text-center text-sm text-[var(--muted)]">
        No favorites yet. Add a meal and check &quot;Add to most used&quot; to save it here.
      </p>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:overflow-visible sm:grid-cols-2 lg:grid-cols-4">
      {foods.map((food) => {
        const defaultAmount =
          food.quick_add_amount != null && food.quick_add_amount > 0
            ? food.quick_add_amount
            : food.base_amount;
        const calculated = calculateNutrition(food, defaultAmount);
        const calories = Math.round(calculated.calories);
        const p = calculated.protein.toFixed(0);
        const c = calculated.carbs.toFixed(0);
        const f = calculated.fats.toFixed(0);
        const defaultLabel =
          defaultAmount !== food.base_amount
            ? `${defaultAmount}${food.base_unit} default`
            : `per ${food.base_amount}${food.base_unit}`;

        const imgSrc = food.image_path
          ? food.image_path.includes(" ")
            ? food.image_path.split("/").map(encodeURIComponent).join("/")
            : food.image_path
          : null;

        return (
          <div
            key={food.id}
            className="flex min-w-[200px] shrink-0 flex-col items-center sm:min-w-0"
          >
            {/* Large image outside and on top of the card */}
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

            {/* Card – relative for absolute trash/edit */}
            <div className="relative -mt-6 flex w-full flex-1 flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 pb-3 pt-10 shadow-sm transition-all hover:shadow-md">
              {/* Edit + Trash – top right absolute */}
              <div className="absolute right-2 top-2 flex gap-1">
                {onEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(food);
                    }}
                    className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--background)] hover:text-[var(--foreground)]"
                    aria-label="Edit favorite"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                {onRemove && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(food);
                    }}
                    className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Remove from favorites"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Name – bigger font */}
              <h4 className="text-center text-base font-semibold leading-tight text-[var(--foreground)] line-clamp-2">
                {food.name}
              </h4>

              {/* Calories · portion – bigger */}
              <p className="mt-1 text-center text-sm font-medium text-[var(--accent)]">
                {calories} kcal · {defaultLabel}
              </p>

              {/* Protein · Carbs · Fats – same as today's meals */}
              <p className="mt-0.5 text-center text-sm text-[var(--muted)]">
                Protein {p}g · Carbs {c}g · Fats {f}g
              </p>

              {/* Add button */}
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => onAddClick(food, defaultAmount)}
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-white transition-colors hover:opacity-90"
                  aria-label={`Add ${food.name}`}
                >
                  <span className="text-xl leading-none">+</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
