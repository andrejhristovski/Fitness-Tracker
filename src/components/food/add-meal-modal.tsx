"use client";

import { useCallback, useMemo, useState } from "react";
import { lookupBarcode } from "@/lib/open-food-facts";
import { BarcodeScanner } from "./barcode-scanner";
import type { Food } from "@/types/database";
import type { LibraryFood } from "@/lib/food-library";
import { Modal } from "@/components/ui/modal";
import { calculateNutrition, formatAmount } from "@/lib/food-utils";
import { MEAL_TYPES, type MealType } from "@/lib/meals";
import { FoodImagePicker } from "./food-image-picker";
import { FoodThumb } from "./food-thumb";
import {
  FoodSearchList,
  MacroPreview,
  chipClass,
  defaultAmountFor,
  fromFood,
  fromLibrary,
  inputClass,
  perLabel,
  presetsFor,
  type Pickable,
} from "./food-picker";

export type NewEntry = {
  food_id: string | null;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  quantity: number;
  meal_type: MealType;
  image_path: string | null;
};

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  foods: Food[];
  /** Recently logged foods, most frequent first, with the last amount used. */
  recent: { foodId: string; amount: number }[];
  prefill: { food: Food; amount: number } | null;
  defaultMeal: MealType;
  onAdd: (entry: NewEntry) => Promise<boolean>;
  /** Save a built-in library food to the user's foods (or return the existing one). */
  onEnsureFood: (lib: LibraryFood) => Promise<Food | null>;
  /** Mark a food as a Quick add favorite with this default amount. */
  onFavorite: (food: Food, amount: number) => Promise<void>;
  onOpenNewFoodType: () => void;
  onCreateMeal: () => void;
}

export function AddMealModal({ isOpen, onClose, ...rest }: AddMealModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add food">
      {/* Remount on every open so the form always starts fresh. */}
      {isOpen && <AddMealForm key={rest.prefill?.food.id ?? "new"} onClose={onClose} {...rest} />}
    </Modal>
  );
}

function AddMealForm({
  onClose,
  foods,
  recent,
  prefill,
  defaultMeal,
  onAdd,
  onEnsureFood,
  onFavorite,
  onOpenNewFoodType,
  onCreateMeal,
}: Omit<AddMealModalProps, "isOpen">) {
  const [tab, setTab] = useState<"foods" | "quick">("foods");
  const [meal, setMeal] = useState<MealType>(defaultMeal);
  const [selected, setSelected] = useState<Pickable | null>(prefill ? fromFood(prefill.food) : null);
  const [amount, setAmount] = useState(prefill ? String(prefill.amount) : "");
  const [quick, setQuick] = useState({ name: "", calories: "", protein: "", carbs: "", fats: "" });
  const [image, setImage] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [scanning, setScanning] = useState(false);
  const [lookup, setLookup] = useState<{ state: "loading" } | { state: "notFound"; code: string } | null>(null);

  const recentAmount = useMemo(() => new Map(recent.map((r) => [r.foodId, r.amount])), [recent]);

  function pick(item: Pickable) {
    setSelected(item);
    setAmount(String(defaultAmountFor(item, item.food && recentAmount.get(item.food.id))));
  }

  const handleBarcode = useCallback(
    async (code: string) => {
      setScanning(false);
      setLookup({ state: "loading" });
      const product = await lookupBarcode(code).catch(() => null);
      if (!product) {
        setLookup({ state: "notFound", code });
        return;
      }
      setLookup(null);
      // Scanned this product before? Use the saved food so history and favorites line up.
      const existing = foods.find((f) => f.name.toLowerCase() === product.name.toLowerCase());
      const item = existing ? fromFood(existing) : { ...fromLibrary(product), key: `off:${product.barcode}` };
      setSelected(item);
      setAmount(String(product.presets?.[0] ?? 100));
    },
    [foods]
  );

  const amountNum = Number(amount.replace(",", ".")) || 0;
  const nutrition = selected && amountNum > 0 ? calculateNutrition(selected, amountNum) : null;
  const quickNutrition = {
    calories: Number(quick.calories) || 0,
    protein: Number(quick.protein) || 0,
    carbs: Number(quick.carbs) || 0,
    fats: Number(quick.fats) || 0,
  };

  async function submit() {
    setSaving(true);
    setError(null);
    let ok = false;
    if (tab === "foods" && selected && nutrition) {
      // Built-in foods become one of the user's foods on first use, so favorites/editing work.
      const food = selected.food ?? (selected.lib ? await onEnsureFood(selected.lib) : null);
      ok =
        !!food &&
        (await onAdd({
          food_id: food.id,
          name: food.name,
          ...calculateNutrition(food, amountNum),
          quantity: amountNum,
          meal_type: meal,
          image_path: food.image_path,
        }));
      if (ok && favorite && food) await onFavorite(food, amountNum);
    } else if (tab === "quick") {
      ok = await onAdd({
        food_id: null,
        name: quick.name.trim() || "Quick entry",
        ...quickNutrition,
        quantity: 1,
        meal_type: meal,
        image_path: image,
      });
    }
    setSaving(false);
    if (ok) onClose();
    else setError("Couldn't save. Try again.");
  }

  const canSubmit = tab === "foods" ? !!nutrition : quick.name.trim() !== "" || quickNutrition.calories > 0;
  const isMeal = selected?.base_unit === "serving";

  return (
    <>
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit && !saving) submit();
      }}
    >
      <div className="flex flex-wrap gap-2">
        {MEAL_TYPES.map((m) => (
          <button key={m.id} type="button" onClick={() => setMeal(m.id)} className={chipClass(meal === m.id)}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1 rounded-xl bg-[var(--background)] p-1">
        {(
          [
            ["foods", "Foods"],
            ["quick", "Quick entry"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === id ? "bg-[var(--card-hover)] text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "foods" &&
        (selected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-[var(--background)] p-3">
              <FoodThumb name={selected.name} path={selected.image_path} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{selected.name}</p>
                <p className="text-xs text-[var(--muted)]">
                  {isMeal ? `${Math.round(selected.calories)} kcal per portion` : perLabel(selected)}
                </p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-sm font-medium text-[var(--accent)] hover:underline">
                Change
              </button>
            </div>

            <div>
              <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--background)] pr-4 focus-within:border-[var(--accent)]">
                <input
                  autoFocus
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  aria-label="Amount"
                  className="w-full bg-transparent px-4 py-3 text-2xl font-semibold tabular-nums outline-none"
                />
                <span className="text-[var(--muted)]">{isMeal ? "portion" : selected.base_unit}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {presetsFor(selected).map((a) => (
                  <button key={a} type="button" onClick={() => setAmount(String(a))} className={chipClass(amountNum === a)}>
                    {isMeal ? `${a} ×` : formatAmount(a, selected.base_unit)}
                  </button>
                ))}
              </div>
            </div>

            {nutrition && <MacroPreview n={nutrition} />}

            {!selected.food?.is_quick_add && (
              <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <input
                  type="checkbox"
                  checked={favorite}
                  onChange={(e) => setFavorite(e.target.checked)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Also add to Quick add with this amount
              </label>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setLookup(null);
                setScanning(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)]/10 py-3 font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/15"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M17 8v8" />
              </svg>
              Scan barcode
            </button>
            {lookup?.state === "loading" && <p className="text-center text-sm text-[var(--muted)]">Looking up product…</p>}
            {lookup?.state === "notFound" && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm">
                <p>
                  Barcode <span className="font-mono">{lookup.code}</span> isn&apos;t in Open Food Facts (or has no calorie data).
                </p>
                <p className="mt-1 text-[var(--muted)]">Use Quick entry, or create a custom food type from the label.</p>
              </div>
            )}
            <FoodSearchList foods={foods} recent={recent} onPick={pick} autoFocus={false} />
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--border)] pt-3">
              <button type="button" onClick={onCreateMeal} className="text-sm font-medium text-[var(--accent)] hover:underline">
                + Create a meal (e.g. oats + whey)
              </button>
              <button type="button" onClick={onOpenNewFoodType} className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)]">
                + Custom food type
              </button>
            </div>
          </div>
        ))}

      {tab === "quick" && (
        <div className="space-y-3">
          <input
            placeholder="What did you eat? e.g. Restaurant burger"
            value={quick.name}
            onChange={(e) => setQuick({ ...quick, name: e.target.value })}
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                ["calories", "kcal"],
                ["protein", "Protein g"],
                ["carbs", "Carbs g"],
                ["fats", "Fats g"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block">
                <span className="mb-1 block text-xs text-[var(--muted)]">{label}</span>
                <input
                  inputMode="decimal"
                  value={quick[key]}
                  onChange={(e) => setQuick({ ...quick, [key]: e.target.value })}
                  placeholder="0"
                  className={`${inputClass} tabular-nums`}
                />
              </label>
            ))}
          </div>
          <FoodImagePicker value={image} onChange={setImage} label="Picture (optional)" />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {(tab === "quick" || selected) && (
        <button
          type="submit"
          disabled={!canSubmit || saving}
          className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40"
        >
          {saving ? "Adding…" : `Add to ${MEAL_TYPES.find((m) => m.id === meal)!.label}`}
        </button>
      )}
    </form>
    {/* Outside the form: the scanner has its own form for typed barcodes. */}
    {scanning && <BarcodeScanner onDetected={handleBarcode} onClose={() => setScanning(false)} />}
    </>
  );
}
