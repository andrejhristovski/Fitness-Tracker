"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Food, FoodEntry } from "@/types/database";
import type { NutritionGoals } from "@/lib/nutrition-goals";
import { normalizeFood } from "@/lib/normalize-food";
import { calculateNutrition, formatAmount } from "@/lib/food-utils";
import { addDays, parseDate } from "@/lib/dates";
import { MEAL_TYPES, mealForNow, normalizeMealType, type MealType } from "@/lib/meals";
import {
  addFoodEntry,
  createFood,
  deleteFoodEntry,
  removeFavorite,
  saveFavoriteFromTemplate,
  updateFoodEntry,
  type NewFood,
} from "@/app/actions/food-actions";
import { DaySummary } from "./day-summary";
import { FoodThumb } from "./food-thumb";
import { AddMealModal, type NewEntry } from "./add-meal-modal";
import { EditEntryModal, type EntryUpdate } from "./edit-entry-modal";
import { FavoriteModal } from "./favorite-modal";
import { SaveFoodModal } from "./save-food-modal";
import { CreateMealModal, type MealDraft } from "./create-meal-modal";
import type { LibraryFood } from "@/lib/food-library";
import { DragGhost, useMealDrag } from "./use-meal-drag";

type DragItem = { kind: "favorite"; food: Food } | { kind: "entry"; entry: FoodEntry };

interface FoodTabProps {
  initialEntries: FoodEntry[];
  initialFoods: Food[];
  goals: NutritionGoals;
  recent: { foodId: string; amount: number }[];
  logDate: string;
  today: string;
}

function dayLabel(date: string, today: string) {
  if (date === today) return "Today";
  if (date === addDays(today, -1)) return "Yesterday";
  return parseDate(date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
}

function favoriteAmount(food: Food) {
  return food.quick_add_amount && food.quick_add_amount > 0 ? food.quick_add_amount : food.base_amount;
}

export function FoodTab({ initialEntries, initialFoods, goals, recent, logDate, today }: FoodTabProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [foods, setFoods] = useState(initialFoods);
  const [addOpen, setAddOpen] = useState(false);
  const [prefill, setPrefill] = useState<{ food: Food; amount: number } | null>(null);
  const [defaultMeal, setDefaultMeal] = useState<MealType>(() => mealForNow());
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [favoriteModal, setFavoriteModal] = useState<{ editing: Food | null } | null>(null);
  const [saveFoodOpen, setSaveFoodOpen] = useState(false);
  const [manage, setManage] = useState(false);
  /** Meal that Quick add's + button logs into; starts at the meal for the current time. */
  const [targetMeal, setTargetMeal] = useState<MealType>(() => mealForNow());
  const [createMealOpen, setCreateMealOpen] = useState(false);
  const [toast, setToast] = useState<{ text: string; onUndo?: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const favorites = foods.filter((f) => f.is_quick_add);
  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + Number(e.calories),
      protein: acc.protein + Number(e.protein),
      carbs: acc.carbs + Number(e.carbs),
      fats: acc.fats + Number(e.fats),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  async function insertEntry(entry: NewEntry): Promise<FoodEntry | null> {
    const result = await addFoodEntry({ ...entry, log_date: logDate });
    if (!result.ok) {
      setError(result.error);
      return null;
    }
    setEntries((prev) => [...prev, result.data]);
    return result.data;
  }

  /** Insert a food row for the user, or return the one they already have with that name. */
  async function saveFood(row: NewFood): Promise<{ food: Food } | { error: string }> {
    const existing = foods.find((f) => f.name.toLowerCase() === row.name.toLowerCase());
    if (existing) return { food: existing };
    const result = await createFood(row);
    if (!result.ok) return { error: result.error };
    const food = result.data;
    if (!result.existed) setFoods((prev) => [...prev, food].sort((a, b) => a.name.localeCompare(b.name)));
    return { food };
  }

  async function ensureLibraryFood(lib: LibraryFood) {
    const result = await saveFood({
      name: lib.name,
      base_amount: lib.base_amount,
      base_unit: lib.base_unit,
      calories: lib.calories,
      protein: lib.protein,
      carbs: lib.carbs,
      fats: lib.fats,
      image_path: lib.image_path,
      is_quick_add: false,
      quick_add_amount: null,
    });
    if ("error" in result) {
      setError(result.error);
      return null;
    }
    return result.food;
  }

  async function saveMeal(meal: MealDraft) {
    if (foods.some((f) => f.name.toLowerCase() === meal.name.toLowerCase())) {
      return `You already have a food called "${meal.name}". Pick another name.`;
    }
    const result = await saveFood({
      ...meal,
      base_amount: 1,
      base_unit: "serving",
      is_quick_add: true,
      quick_add_amount: 1,
    });
    if ("error" in result) return result.error;
    setToast({ text: `Saved "${meal.name}" — tap + in Quick add to log it` });
    return null;
  }

  /** Put a food on Quick add (or change its default amount). */
  async function markFavorite(food: Food, amount: number) {
    const result = await saveFavoriteFromTemplate(food.id, amount, food.image_path);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setFoods((prev) => prev.map((f) => (f.id === food.id ? result.data : f)));
    return true;
  }

  async function quickAdd(food: Food, meal: MealType = targetMeal) {
    const amount = favoriteAmount(food);
    const created = await insertEntry({
      food_id: food.id,
      name: food.name,
      ...calculateNutrition(food, amount),
      quantity: amount,
      meal_type: meal,
      image_path: food.image_path,
    });
    if (created) {
      const label = MEAL_TYPES.find((m) => m.id === meal)!.label;
      setToast({
        text: `Added ${food.name} (${formatAmount(amount, food.base_unit)}) to ${label}`,
        onUndo: () => deleteEntry(created.id),
      });
    }
  }

  async function deleteEntry(id: string) {
    const result = await deleteFoodEntry(id);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    return true;
  }

  /** Delete with a few seconds to undo (Undo logs the same item again). */
  async function removeEntry(entry: FoodEntry) {
    if (!(await deleteEntry(entry.id))) return;
    setToast({
      text: `Removed ${entry.name}`,
      onUndo: () =>
        insertEntry({
          food_id: entry.food_id,
          name: entry.name,
          calories: Number(entry.calories),
          protein: Number(entry.protein),
          carbs: Number(entry.carbs),
          fats: Number(entry.fats),
          quantity: Number(entry.quantity),
          meal_type: normalizeMealType(entry.meal_type),
          image_path: entry.image_path,
        }),
    });
  }

  async function updateEntry(id: string, update: Partial<EntryUpdate>) {
    const result = await updateFoodEntry(id, update);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    setEntries((prev) => prev.map((e) => (e.id === id ? result.data : e)));
    return true;
  }

  // Drag a favorite onto a meal to log it there, or drag a logged item to another meal to move it.
  const { drag, bind } = useMealDrag<DragItem>((item, meal) => {
    if (item.kind === "favorite") {
      quickAdd(item.food, meal);
    } else if (normalizeMealType(item.entry.meal_type) !== meal) {
      updateEntry(item.entry.id, { meal_type: meal });
    }
  });
  const mealLabel = (id: MealType | null) => MEAL_TYPES.find((m) => m.id === id)?.label ?? null;

  function openAdd(meal: MealType, food?: Food) {
    setDefaultMeal(meal);
    setPrefill(food ? { food, amount: favoriteAmount(food) } : null);
    setAddOpen(true);
  }

  const isToday = logDate === today;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-28">
      {/* Header + day switcher */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Food</h1>
        <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1">
          <Link
            href={`/app?date=${addDays(logDate, -1)}`}
            className="rounded-lg px-2.5 py-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]"
            aria-label="Previous day"
          >
            ‹
          </Link>
          <span className="min-w-24 text-center text-sm font-medium">{dayLabel(logDate, today)}</span>
          {isToday ? (
            <span className="px-2.5 py-1.5 text-[var(--border)]" aria-hidden="true">
              ›
            </span>
          ) : (
            <Link
              href={addDays(logDate, 1) >= today ? "/app" : `/app?date=${addDays(logDate, 1)}`}
              className="rounded-lg px-2.5 py-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--card-hover)] hover:text-[var(--foreground)]"
              aria-label="Next day"
            >
              ›
            </Link>
          )}
        </div>
      </div>

      {!isToday && (
        <div className="flex items-center justify-between rounded-xl bg-[var(--accent)]/10 px-4 py-2 text-sm">
          <span>You&apos;re editing a past day.</span>
          <Link href="/app" className="font-medium text-[var(--accent)] hover:underline">
            Back to today
          </Link>
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <DaySummary totals={totals} goals={goals} />

      {/* Favorites: one tap logs the usual amount */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="shrink-0 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">Quick add</h2>
          <div className="flex gap-1.5 [&>button]:whitespace-nowrap [&>button]:px-2.5 sm:gap-2 sm:[&>button]:px-3">
            {favorites.length > 0 && (
              <button
                type="button"
                onClick={() => setManage((m) => !m)}
                className="rounded-lg px-3 py-1.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
              >
                {manage ? "Done" : "Edit"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setFavoriteModal({ editing: null })}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--card-hover)]"
            >
              + Favorite
            </button>
            <button
              type="button"
              onClick={() => setCreateMealOpen(true)}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--card-hover)]"
            >
              + Meal
            </button>
          </div>
        </div>
        {favorites.length > 0 && !manage && (
          <div className="mb-3 flex items-center gap-2">
            <span className="shrink-0 text-xs text-[var(--muted)]">Add to</span>
            <div className="grid flex-1 grid-cols-4 gap-1 rounded-xl bg-[var(--card)] p-1" role="radiogroup" aria-label="Meal for Quick add">
              {MEAL_TYPES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={targetMeal === m.id}
                  onClick={() => setTargetMeal(m.id)}
                  className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                    targetMeal === m.id ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {favorites.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--border)] px-5 py-6 text-center text-sm text-[var(--muted)]">
            Save foods or whole meals you eat often (e.g. 60 g oats + 30 g whey), then log them with one tap.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {favorites.map((food) => {
              const amount = favoriteAmount(food);
              const kcal = Math.round(calculateNutrition(food, amount).calories);
              return (
                <div
                  key={food.id}
                  {...(manage ? {} : bind({ kind: "favorite", food }, food.name))}
                  className={`flex items-center gap-2.5 rounded-2xl border bg-[var(--card)] p-2.5 transition-colors hover:border-[var(--accent)]/40 ${
                    drag?.item.kind === "favorite" && drag.item.food.id === food.id ? "border-[var(--accent)] opacity-50" : "border-[var(--border)]"
                  }`}
                >
                  <button type="button" onClick={() => openAdd(targetMeal, food)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                    <FoodThumb name={food.name} path={food.image_path} size={40} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{food.name}</span>
                      <span className="block text-xs text-[var(--muted)]">
                        {food.base_unit === "serving" ? "Meal" : formatAmount(amount, food.base_unit)} · {kcal} kcal
                      </span>
                    </span>
                  </button>
                  {manage ? (
                    <span className="flex shrink-0 flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => setFavoriteModal({ editing: food })}
                        className="rounded-md px-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const result = await removeFavorite(food.id);
                          if (result.ok) setFoods((prev) => prev.map((f) => (f.id === food.id ? result.data : f)));
                          else setError(result.error);
                        }}
                        className="rounded-md px-1.5 text-xs text-red-400"
                      >
                        Remove
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => quickAdd(food)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-lg font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
                      aria-label={`Log ${food.name}`}
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {favorites.length > 0 && !manage && (
          <p className="mt-2 text-xs text-[var(--muted)]">Tip: hold a card and drag it onto a meal below. Hold a logged food to move it.</p>
        )}
      </section>

      {/* Meals */}
      <section className="space-y-3">
        {MEAL_TYPES.map((meal) => {
          const items = entries.filter((e) => normalizeMealType(e.meal_type) === meal.id);
          const kcal = items.reduce((s, e) => s + Number(e.calories), 0);
          return (
            <div
              key={meal.id}
              data-meal={meal.id}
              className={`rounded-2xl border bg-[var(--card)] transition-colors ${
                drag?.over === meal.id
                  ? "border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/40"
                  : drag
                    ? "border-dashed border-[var(--muted)]"
                    : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <h3 className="font-semibold">{meal.label}</h3>
                  <p className="text-xs text-[var(--muted)]">
                    {items.length ? `${Math.round(kcal)} kcal · ${items.length} item${items.length > 1 ? "s" : ""}` : "Nothing yet"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openAdd(meal.id)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
                >
                  + Add
                </button>
              </div>
              {items.length > 0 && (
                <ul className="border-t border-[var(--border)]">
                  {items.map((e) => (
                    <li
                      key={e.id}
                      {...bind({ kind: "entry", entry: e }, e.name)}
                      className={`flex items-center border-b border-[var(--border)] transition-colors last:border-b-0 hover:bg-[var(--card-hover)] ${
                        drag?.item.kind === "entry" && drag.item.entry.id === e.id ? "opacity-40" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setEditing(e)}
                        className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-4 text-left"
                      >
                        <FoodThumb name={e.name} path={e.image_path} size={36} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{e.name}</span>
                          <span className="block text-xs text-[var(--muted)]">
                            {e.food_id ? `${formatAmount(Number(e.quantity), foods.find((f) => f.id === e.food_id)?.base_unit ?? "g")} · ` : ""}
                            P {Math.round(Number(e.protein))} · C {Math.round(Number(e.carbs))} · F {Math.round(Number(e.fats))}
                          </span>
                        </span>
                        <span className="text-sm font-semibold tabular-nums">{Math.round(Number(e.calories))}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEntry(e)}
                        // Don't let a press on the bin start a drag of the row.
                        onPointerDown={(ev) => ev.stopPropagation()}
                        className="flex h-11 w-11 shrink-0 items-center justify-center text-[var(--muted)] transition-colors hover:text-red-400"
                        aria-label={`Remove ${e.name}`}
                      >
                        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      <DragGhost drag={drag} overLabel={mealLabel(drag?.over ?? null)} />

      {/* Floating add button */}
      <button
        type="button"
        onClick={() => openAdd(mealForNow())}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-30 flex h-14 items-center gap-2 rounded-2xl sm:bottom-6 sm:right-6 bg-[var(--accent)] px-5 font-semibold text-white shadow-lg transition-colors hover:bg-[var(--accent-hover)]"
      >
        <span className="text-xl leading-none">+</span> Add food
      </button>

      {toast && (
        <div className="fixed bottom-[calc(9.5rem+env(safe-area-inset-bottom))] left-1/2 z-50 sm:bottom-24 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card-hover)] px-4 py-3 text-sm shadow-xl">
          <span className="min-w-0 truncate">{toast.text}</span>
          {toast.onUndo && (
            <button
              type="button"
              onClick={() => {
                const undo = toast.onUndo!;
                setToast(null);
                undo();
              }}
              className="shrink-0 font-semibold text-[var(--accent)]"
            >
              Undo
            </button>
          )}
        </div>
      )}

      <AddMealModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        foods={foods}
        recent={recent}
        prefill={prefill}
        defaultMeal={defaultMeal}
        onAdd={async (entry) => !!(await insertEntry(entry))}
        onEnsureFood={ensureLibraryFood}
        onFavorite={async (food, amount) => {
          await markFavorite(food, amount);
        }}
        onOpenNewFoodType={() => setSaveFoodOpen(true)}
        onCreateMeal={() => {
          setAddOpen(false);
          setCreateMealOpen(true);
        }}
      />
      <CreateMealModal isOpen={createMealOpen} onClose={() => setCreateMealOpen(false)} foods={foods} onSave={saveMeal} />
      <EditEntryModal
        entry={editing}
        food={editing?.food_id ? foods.find((f) => f.id === editing.food_id) ?? null : null}
        onClose={() => setEditing(null)}
        onSave={async (update) => {
          const ok = editing ? await updateEntry(editing.id, update) : false;
          if (ok) setEditing(null);
          return ok;
        }}
        onDelete={async () => {
          if (editing && (await deleteEntry(editing.id))) setEditing(null);
        }}
      />
      <FavoriteModal
        isOpen={favoriteModal !== null}
        onClose={() => setFavoriteModal(null)}
        foods={foods}
        editing={favoriteModal?.editing ?? null}
        onEnsureFood={ensureLibraryFood}
        onSave={markFavorite}
      />
      <SaveFoodModal
        isOpen={saveFoodOpen}
        onClose={() => setSaveFoodOpen(false)}
        onSaved={(food) => setFoods((prev) => [...prev, normalizeFood(food)].sort((a, b) => a.name.localeCompare(b.name)))}
      />
    </div>
  );
}
