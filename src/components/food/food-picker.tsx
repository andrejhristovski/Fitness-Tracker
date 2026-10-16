"use client";

import { useMemo, useState } from "react";
import type { Food } from "@/types/database";
import { FOOD_LIBRARY, findLibraryFood, type LibraryFood } from "@/lib/food-library";
import { amountPresets } from "@/lib/food-utils";
import { MACRO_COLORS } from "@/lib/macro-colors";
import { FoodThumb } from "./food-thumb";

/** Something the user can log: one of their saved foods, or a built-in library food. */
export type Pickable = {
  key: string;
  name: string;
  base_amount: number;
  base_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  image_path: string | null;
  food?: Food;
  lib?: LibraryFood;
};

export function fromFood(food: Food): Pickable {
  return { ...food, key: food.id, food };
}

export function fromLibrary(lib: LibraryFood): Pickable {
  return { ...lib, key: `lib:${lib.name}`, lib };
}

export function presetsFor(item: Pickable) {
  return amountPresets(item, (item.lib ?? findLibraryFood(item.name))?.presets);
}

/** Default amount: last logged amount, the favorite amount, a typical portion, or the base amount. */
export function defaultAmountFor(item: Pickable, recentAmount?: number) {
  if (recentAmount) return recentAmount;
  if (item.food?.quick_add_amount && item.food.quick_add_amount > 0) return item.food.quick_add_amount;
  const presets = (item.lib ?? findLibraryFood(item.name))?.presets;
  if (presets) return presets[Math.floor((presets.length - 1) / 2)];
  return item.base_amount;
}

export function perLabel(item: Pick<Pickable, "calories" | "base_amount" | "base_unit">) {
  return `${Math.round(item.calories)} kcal per ${item.base_amount} ${item.base_unit}`;
}

export function chipClass(active: boolean) {
  return `rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
    active
      ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
      : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
  }`;
}

export const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]";

export function MacroPreview({ n }: { n: { calories: number; protein: number; carbs: number; fats: number } }) {
  const items = [
    { label: "kcal", value: Math.round(n.calories), color: "var(--accent)" },
    { label: "Protein g", value: Math.round(n.protein), color: MACRO_COLORS.protein },
    { label: "Carbs g", value: Math.round(n.carbs), color: MACRO_COLORS.carbs },
    { label: "Fats g", value: Math.round(n.fats), color: MACRO_COLORS.fats },
  ];
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((i) => (
        <div key={i.label} className="rounded-xl bg-[var(--background)] px-2 py-2 text-center">
          <p className="text-lg font-semibold tabular-nums">{i.value}</p>
          <p className="flex items-center justify-center gap-1 text-[11px] text-[var(--muted)]">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: i.color }} />
            {i.label}
          </p>
        </div>
      ))}
    </div>
  );
}

interface FoodSearchListProps {
  foods: Food[];
  recent?: { foodId: string; amount: number }[];
  onPick: (item: Pickable) => void;
  /** Hide saved meals (combos) — used when building a meal. */
  excludeMeals?: boolean;
  autoFocus?: boolean;
}

/** Search box + grouped list: favorites, recent, your foods, then the built-in library. */
export function FoodSearchList({ foods, recent = [], onPick, excludeMeals, autoFocus = true }: FoodSearchListProps) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const own = excludeMeals ? foods.filter((f) => f.base_unit !== "serving") : foods;
    const ownNames = new Set(own.map((f) => f.name.toLowerCase()));
    const library = FOOD_LIBRARY.filter((l) => !ownNames.has(l.name.toLowerCase()));
    const q = query.trim().toLowerCase();

    if (q) {
      return [
        { title: "Your foods", items: own.filter((f) => f.name.toLowerCase().includes(q)).map(fromFood) },
        { title: "Food library", items: library.filter((l) => l.name.toLowerCase().includes(q)).map(fromLibrary) },
      ].filter((g) => g.items.length > 0);
    }

    const byId = new Map(own.map((f) => [f.id, f]));
    const favorites = own.filter((f) => f.is_quick_add);
    const recentFoods = recent
      .map((r) => byId.get(r.foodId))
      .filter((f): f is Food => !!f && !f.is_quick_add)
      .slice(0, 6);
    const shown = new Set([...favorites, ...recentFoods].map((f) => f.id));
    return [
      { title: "Favorites", items: favorites.map(fromFood) },
      { title: "Recent", items: recentFoods.map(fromFood) },
      { title: "Your foods", items: own.filter((f) => !shown.has(f.id)).map(fromFood) },
      { title: "Food library", items: library.map(fromLibrary) },
    ].filter((g) => g.items.length > 0);
  }, [foods, recent, query, excludeMeals]);

  return (
    <div className="space-y-3">
      <input
        type="search"
        autoFocus={autoFocus}
        placeholder="Search foods, e.g. oats, eggs, chicken…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={inputClass}
      />
      {groups.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--muted)]">No match. Create a food type, or use Quick entry.</p>
      ) : (
        <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
          {groups.map((g) => (
            <div key={g.title}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{g.title}</p>
              <ul className="space-y-0.5">
                {g.items.map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => onPick(item)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[var(--card-hover)]"
                    >
                      <FoodThumb name={item.name} path={item.image_path} size={36} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{item.name}</span>
                        <span className="block text-xs text-[var(--muted)]">
                          {item.base_unit === "serving" ? `Meal · ${Math.round(item.calories)} kcal` : perLabel(item)}
                        </span>
                      </span>
                      <span className="text-lg text-[var(--accent)]">›</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
