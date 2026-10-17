"use client";

import { useState } from "react";
import type { Food } from "@/types/database";
import { Modal } from "@/components/ui/modal";
import { calculateNutrition } from "@/lib/food-utils";
import { FoodImagePicker } from "./food-image-picker";
import { FoodThumb } from "./food-thumb";
import { FoodSearchList, MacroPreview, defaultAmountFor, inputClass, type Pickable } from "./food-picker";

export type MealDraft = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  image_path: string | null;
};

interface CreateMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  foods: Food[];
  /** Returns an error message, or null on success. */
  onSave: (meal: MealDraft) => Promise<string | null>;
}

export function CreateMealModal({ isOpen, onClose, foods, onSave }: CreateMealModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a meal">
      {isOpen && <MealForm foods={foods} onSave={onSave} onClose={onClose} />}
    </Modal>
  );
}

type Row = { item: Pickable; amount: string };

function MealForm({ foods, onSave, onClose }: Omit<CreateMealModalProps, "isOpen">) {
  const [name, setName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [picking, setPicking] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = rows.reduce(
    (acc, r) => {
      const n = calculateNutrition(r.item, Number(r.amount.replace(",", ".")) || 0);
      return {
        calories: acc.calories + n.calories,
        protein: acc.protein + n.protein,
        carbs: acc.carbs + n.carbs,
        fats: acc.fats + n.fats,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  async function save() {
    setSaving(true);
    setError(null);
    const r = (n: number) => Math.round(n * 10) / 10;
    const err = await onSave({
      name: name.trim(),
      calories: Math.round(totals.calories),
      protein: r(totals.protein),
      carbs: r(totals.carbs),
      fats: r(totals.fats),
      // null = icon picked automatically from the meal's name.
      image_path: image,
    });
    setSaving(false);
    if (err) setError(err);
    else onClose();
  }

  return (
    <div className="space-y-4">
      <input
        autoFocus
        placeholder="Meal name, e.g. Oats + whey"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={inputClass}
      />

      {rows.length > 0 && (
        <ul className="space-y-1.5">
          {rows.map((row, i) => {
            const kcal = calculateNutrition(row.item, Number(row.amount.replace(",", ".")) || 0).calories;
            return (
              <li key={row.item.key} className="flex items-center gap-2 rounded-xl bg-[var(--background)] p-2">
                <FoodThumb name={row.item.name} path={row.item.image_path} size={32} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.item.name}</span>
                <span className="flex items-center rounded-lg border border-[var(--border)] pr-2 focus-within:border-[var(--accent)]">
                  <input
                    inputMode="decimal"
                    value={row.amount}
                    onChange={(e) => setRows((prev) => prev.map((r, j) => (j === i ? { ...r, amount: e.target.value } : r)))}
                    aria-label={`${row.item.name} amount`}
                    className="w-14 bg-transparent px-2 py-1.5 text-right text-sm tabular-nums outline-none"
                  />
                  <span className="text-xs text-[var(--muted)]">{row.item.base_unit}</span>
                </span>
                <span className="w-14 text-right text-xs tabular-nums text-[var(--muted)]">{Math.round(kcal)} kcal</span>
                <button
                  type="button"
                  onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                  className="px-1 text-[var(--muted)] hover:text-red-400"
                  aria-label={`Remove ${row.item.name}`}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {picking ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Add an ingredient</p>
          <FoodSearchList
            foods={foods}
            excludeMeals
            autoFocus={false}
            onPick={(item) => {
              setRows((prev) =>
                prev.some((r) => r.item.key === item.key) ? prev : [...prev, { item, amount: String(defaultAmountFor(item)) }]
              );
              setPicking(false);
            }}
          />
        </div>
      ) : (
        <button type="button" onClick={() => setPicking(true)} className="text-sm font-medium text-[var(--accent)] hover:underline">
          + Add ingredient
        </button>
      )}

      {rows.length > 0 && (
        <>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">One portion</p>
            <MacroPreview n={totals} />
          </div>
          <FoodImagePicker value={image} onChange={setImage} name={name} />
        </>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        disabled={!name.trim() || rows.length === 0 || saving}
        onClick={save}
        className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40"
      >
        {saving ? "Saving…" : "Save meal to Quick add"}
      </button>
    </div>
  );
}
