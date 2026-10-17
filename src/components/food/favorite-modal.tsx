"use client";

import { useState } from "react";
import type { Food } from "@/types/database";
import type { LibraryFood } from "@/lib/food-library";
import { Modal } from "@/components/ui/modal";
import { AmountPicker, FoodSearchList, defaultAmountFor, fromFood, type Pickable } from "./food-picker";
import { MealBuilder, type MealDraft } from "./meal-builder";

export type FavoriteTab = "single" | "combine";

interface FavoriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  foods: Food[];
  /** Favorite being edited, or null to add a new one. */
  editing: Food | null;
  /** Which tab a new favorite starts on. */
  initialTab?: FavoriteTab;
  onEnsureFood: (lib: LibraryFood) => Promise<Food | null>;
  /** Save a single food as a Quick add favorite with this default amount. */
  onSave: (food: Food, amount: number) => Promise<boolean>;
  /** Create a meal (mealId undefined) or update one. Returns an error message or null. */
  onSaveMeal: (draft: MealDraft, mealId?: string) => Promise<string | null>;
}

const isMeal = (f: Food | null) => f?.base_unit === "serving";

export function FavoriteModal({ isOpen, onClose, editing, initialTab = "single", ...rest }: FavoriteModalProps) {
  const title = editing ? (isMeal(editing) ? "Edit meal" : "Edit favorite") : "Add to Quick add";
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {isOpen && (
        <FavoriteForm key={`${editing?.id ?? "new"}-${initialTab}`} editing={editing} initialTab={initialTab} onClose={onClose} {...rest} />
      )}
    </Modal>
  );
}

function favoriteAmount(food: Food) {
  return food.quick_add_amount && food.quick_add_amount > 0 ? food.quick_add_amount : food.base_amount;
}

function FavoriteForm({
  editing,
  initialTab,
  foods,
  onEnsureFood,
  onSave,
  onSaveMeal,
  onClose,
}: Omit<FavoriteModalProps, "isOpen" | "initialTab"> & { initialTab: FavoriteTab }) {
  const [tab, setTab] = useState<FavoriteTab>(editing ? (isMeal(editing) ? "combine" : "single") : initialTab);
  const [selected, setSelected] = useState<Pickable | null>(editing && !isMeal(editing) ? fromFood(editing) : null);
  const [amount, setAmount] = useState(editing ? String(favoriteAmount(editing)) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNum = Number(amount.replace(",", ".")) || 0;

  async function saveSingle() {
    if (!selected || amountNum <= 0) return;
    setSaving(true);
    setError(null);
    const food = selected.food ?? (selected.lib ? await onEnsureFood(selected.lib) : null);
    const ok = !!food && (await onSave(food, amountNum));
    setSaving(false);
    if (ok) onClose();
    else setError("Couldn't save. Try again.");
  }

  return (
    <div className="space-y-4">
      {!editing && (
        <div className="flex gap-1 rounded-xl bg-[var(--background)] p-1">
          {(
            [
              ["single", "Single food"],
              ["combine", "Combine foods"],
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
      )}

      {tab === "combine" ? (
        <MealBuilder
          foods={foods}
          meal={editing ?? undefined}
          onSave={(draft) => onSaveMeal(draft, editing?.id)}
          onDone={onClose}
        />
      ) : !selected ? (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">Pick a food you eat often. You&apos;ll log it with one tap from Quick add.</p>
          {/* Already-favorited foods are hidden: they're on Quick add already. */}
          <FoodSearchList
            foods={foods.filter((f) => !f.is_quick_add)}
            onPick={(item) => {
              setSelected(item);
              setAmount(String(defaultAmountFor(item)));
            }}
          />
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveSingle();
          }}
        >
          <AmountPicker item={selected} amount={amount} onAmountChange={setAmount} onChange={editing ? undefined : () => setSelected(null)} />
          <p className="text-xs text-[var(--muted)]">This is the amount logged when you tap + on Quick add.</p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={amountNum <= 0 || saving}
            className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold text-[var(--on-accent)] transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40"
          >
            {saving ? "Saving…" : editing ? "Save" : "Add to Quick add"}
          </button>
        </form>
      )}
    </div>
  );
}
