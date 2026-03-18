"use client";

import { useState } from "react";
import type { Food, FoodEntry } from "@/types/database";
import type { NutritionGoals } from "@/lib/nutrition-goals";
import { normalizeFood } from "@/lib/normalize-food";
import { removeFavorite } from "@/app/actions/food-actions";
import { DailyNutritionProgress } from "./daily-nutrition-progress";
import { MostUsedCards } from "./most-used-cards";
import { TodayEntriesCards } from "./today-entries-cards";
import { AddMealModal } from "./add-meal-modal";
import { AddFavoriteModal } from "./add-favorite-modal";
import { SaveFoodModal } from "./save-food-modal";

interface FoodTabProps {
  initialEntries: FoodEntry[];
  initialFoods: Food[];
  initialGoals: NutritionGoals;
  logDate: string;
}

export function FoodTab({
  initialEntries,
  initialFoods,
  initialGoals,
  logDate,
}: FoodTabProps) {
  const [entries, setEntries] = useState<FoodEntry[]>(initialEntries);
  const [foods, setFoods] = useState<Food[]>(initialFoods);
  const [goals] = useState<NutritionGoals>(initialGoals);
  const [addMealOpen, setAddMealOpen] = useState(false);
  const [addFavoriteOpen, setAddFavoriteOpen] = useState(false);
  const [editingFavorite, setEditingFavorite] = useState<Food | null>(null);
  const [saveFoodOpen, setSaveFoodOpen] = useState(false);
  const [addMealPrefilled, setAddMealPrefilled] = useState<Food | null>(null);
  const [addMealPrefilledAmount, setAddMealPrefilledAmount] = useState<number | null>(null);

  const mostUsedFoods = foods.filter((f) => f.is_quick_add === true);

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + Number(e.calories),
      protein: acc.protein + Number(e.protein),
      carbs: acc.carbs + Number(e.carbs),
      fats: acc.fats + Number(e.fats),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  function openAddMeal(food?: Food, defaultAmount?: number) {
    setAddMealPrefilled(food ?? null);
    setAddMealPrefilledAmount(defaultAmount ?? null);
    setAddMealOpen(true);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Nutrition</h1>
        <p className="text-sm text-[var(--muted)]">{logDate}</p>
      </div>

      {/* Daily progress */}
      <section>
        <DailyNutritionProgress totals={totals} goals={goals} />
      </section>

      {/* Most used – quick add */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
            Most used
          </h2>
          <button
            type="button"
            onClick={() => {
              setEditingFavorite(null);
              setAddFavoriteOpen(true);
            }}
            className="rounded-lg border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1.5 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/20"
          >
            Add favorite
          </button>
        </div>
        <MostUsedCards
          foods={mostUsedFoods}
          onAddClick={(food, defaultAmount) => openAddMeal(food, defaultAmount)}
          onEdit={(food) => {
            setEditingFavorite(food);
            setAddFavoriteOpen(true);
          }}
          onRemove={async (food) => {
            const result = await removeFavorite(food.id);
            if (result.ok) setFoods((prev) => prev.map((f) => (f.id === food.id ? result.data : f)));
          }}
        />
      </section>

      {/* Divider */}
      <div className="border-t border-[var(--border)]" />

      {/* Today&apos;s meals */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          Today&apos;s meals
        </h2>
        <TodayEntriesCards
          entries={entries}
          onDeleted={(id) => setEntries((prev) => prev.filter((e) => e.id !== id))}
        />
      </section>

      {/* Floating Add Meal button */}
      <button
        type="button"
        onClick={() => openAddMeal()}
        className="fixed bottom-6 right-6 z-40 flex h-14 items-center gap-2 rounded-2xl bg-[var(--accent)] px-5 py-3 font-semibold text-white shadow-lg transition-all hover:bg-[var(--accent-hover)] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
        aria-label="Add meal"
      >
        <span className="text-xl">+</span>
        <span>Add Meal</span>
      </button>

      {/* Modals */}
      <AddMealModal
        isOpen={addMealOpen}
        onClose={() => setAddMealOpen(false)}
        logDate={logDate}
        foods={foods}
        prefilledFood={addMealPrefilled}
        prefilledAmount={addMealPrefilledAmount}
        onAdded={(entry) => setEntries((prev) => [entry, ...prev])}
        onOpenNewFoodType={() => setSaveFoodOpen(true)}
      />
      <AddFavoriteModal
        isOpen={addFavoriteOpen}
        onClose={() => {
          setAddFavoriteOpen(false);
          setEditingFavorite(null);
        }}
        foods={foods}
        editingFood={editingFavorite}
        onSaved={(food) => {
          const normalized = normalizeFood(food);
          setFoods((prev) => {
            const idx = prev.findIndex((f) => f.id === normalized.id);
            if (idx >= 0) return prev.map((f) => (f.id === normalized.id ? normalized : f));
            return [...prev, normalized];
          });
          setEditingFavorite(null);
        }}
        onOpenNewFoodType={() => setSaveFoodOpen(true)}
      />
      <SaveFoodModal
        isOpen={saveFoodOpen}
        onClose={() => setSaveFoodOpen(false)}
        onSaved={(food) => setFoods((prev) => [...prev, normalizeFood(food)])}
      />
    </div>
  );
}
