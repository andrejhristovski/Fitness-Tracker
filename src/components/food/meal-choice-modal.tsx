"use client";

import type { Food } from "@/types/database";
import { Modal } from "@/components/ui/modal";
import { calculateNutrition, formatAmount } from "@/lib/food-utils";
import { MEAL_TYPES, mealForNow, type MealType } from "@/lib/meals";
import { FoodThumb } from "./food-thumb";

interface MealChoiceModalProps {
  /** The favorite being logged, or null when closed. */
  food: Food | null;
  amount: number;
  onPick: (meal: MealType) => void;
  onClose: () => void;
}

/** "Add to which meal?" sheet shown when + is tapped on a Quick add favorite. One tap logs it. */
export function MealChoiceModal({ food, amount, onPick, onClose }: MealChoiceModalProps) {
  const suggested = mealForNow();
  return (
    <Modal isOpen={!!food} onClose={onClose} title="Add to which meal?">
      {food && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-[var(--background)] p-3">
            <FoodThumb name={food.name} path={food.image_path} size={44} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{food.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {food.base_unit === "serving" ? "1 portion" : formatAmount(amount, food.base_unit)} ·{" "}
                {Math.round(calculateNutrition(food, amount).calories)} kcal
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MEAL_TYPES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onPick(m.id)}
                className={`rounded-2xl border px-4 py-4 text-left font-semibold transition-colors ${
                  m.id === suggested
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--accent)]/50"
                }`}
              >
                {m.label}
                {m.id === suggested && <span className="mt-0.5 block text-xs font-normal text-[var(--muted)]">now</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
