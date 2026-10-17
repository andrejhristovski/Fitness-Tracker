"use client";

import { useState } from "react";
import type { Food, FoodEntry } from "@/types/database";
import { Modal } from "@/components/ui/modal";
import { calculateNutrition } from "@/lib/food-utils";
import { MEAL_TYPES, normalizeMealType, type MealType } from "@/lib/meals";
import { FoodThumb } from "./food-thumb";

export type EntryUpdate = Pick<FoodEntry, "calories" | "protein" | "carbs" | "fats" | "quantity" | "meal_type">;

interface EditEntryModalProps {
  entry: FoodEntry | null;
  /** The saved food the entry came from, when it still exists (lets the amount drive the macros). */
  food: Food | null;
  onClose: () => void;
  onSave: (update: EntryUpdate) => Promise<boolean>;
  onDelete: () => Promise<void>;
  /** Already on Quick add (hides the ★ button). */
  isFavorite: boolean;
  /** Put this item on Quick add. */
  onFavorite: () => void;
}

export function EditEntryModal({ entry, food, onClose, onSave, onDelete, isFavorite, onFavorite }: EditEntryModalProps) {
  return (
    <Modal isOpen={!!entry} onClose={onClose} title="Edit entry">
      {entry && (
        <EditForm
          key={entry.id}
          entry={entry}
          food={food}
          onSave={onSave}
          onDelete={onDelete}
          isFavorite={isFavorite}
          onFavorite={onFavorite}
        />
      )}
    </Modal>
  );
}

const input =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 tabular-nums outline-none focus:border-[var(--accent)]";

function EditForm({
  entry,
  food,
  onSave,
  onDelete,
  isFavorite,
  onFavorite,
}: Omit<EditEntryModalProps, "onClose" | "entry"> & { entry: FoodEntry }) {
  const [meal, setMeal] = useState<MealType>(normalizeMealType(entry.meal_type));
  const [amount, setAmount] = useState(String(Number(entry.quantity)));
  const [values, setValues] = useState({
    calories: String(Math.round(Number(entry.calories))),
    protein: String(Number(entry.protein)),
    carbs: String(Number(entry.carbs)),
    fats: String(Number(entry.fats)),
  });
  const [busy, setBusy] = useState(false);

  const amountNum = Number(amount.replace(",", ".")) || 0;
  const fromFood = food && amountNum > 0 ? calculateNutrition(food, amountNum) : null;

  async function save() {
    setBusy(true);
    await onSave(
      fromFood
        ? { ...fromFood, quantity: amountNum, meal_type: meal }
        : {
            calories: Number(values.calories) || 0,
            protein: Number(values.protein) || 0,
            carbs: Number(values.carbs) || 0,
            fats: Number(values.fats) || 0,
            quantity: Number(entry.quantity),
            meal_type: meal,
          }
    );
    setBusy(false);
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="flex items-center gap-3">
        <FoodThumb name={entry.name} path={entry.image_path} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{entry.name}</p>
          <p className="text-xs text-[var(--muted)]">
            {Math.round(fromFood?.calories ?? Number(values.calories))} kcal
          </p>
        </div>
        {isFavorite ? (
          <span className="shrink-0 text-xs text-[var(--muted)]">★ On Quick add</span>
        ) : (
          <button
            type="button"
            onClick={onFavorite}
            className="shrink-0 rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-[var(--accent)]/60 hover:text-[var(--accent)]"
          >
            ★ Add to Quick add
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {MEAL_TYPES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMeal(m.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              meal === m.id
                ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {food ? (
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--muted)]">Amount</span>
          <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--background)] pr-4 focus-within:border-[var(--accent)]">
            <input
              autoFocus
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent px-3 py-2.5 text-lg font-semibold tabular-nums outline-none"
            />
            <span className="text-[var(--muted)]">{food.base_unit}</span>
          </div>
        </label>
      ) : (
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
              <input inputMode="decimal" value={values[key]} onChange={(e) => setValues({ ...values, [key]: e.target.value })} className={input} />
            </label>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await onDelete();
            setBusy(false);
          }}
          className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-40"
        >
          Delete
        </button>
        <button
          type="submit"
          disabled={busy || (!!food && amountNum <= 0)}
          className="flex-1 rounded-xl bg-[var(--accent)] py-3 font-semibold text-[var(--on-accent)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </form>
  );
}
