"use client";

import { useState } from "react";
import type { Food } from "@/types/database";
import type { LibraryFood } from "@/lib/food-library";
import { Modal } from "@/components/ui/modal";
import { AmountPicker, FoodSearchList, defaultAmountFor, fromFood, type Pickable } from "./food-picker";

interface FavoriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  foods: Food[];
  /** Favorite being edited (only its amount can change), or null to add a new one. */
  editing: Food | null;
  onEnsureFood: (lib: LibraryFood) => Promise<Food | null>;
  /** Save the food as a Quick add favorite with this default amount. */
  onSave: (food: Food, amount: number) => Promise<boolean>;
}

export function FavoriteModal({ isOpen, onClose, editing, ...rest }: FavoriteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editing ? "Edit favorite" : "Add to Quick add"}>
      {isOpen && <FavoriteForm key={editing?.id ?? "new"} editing={editing} onClose={onClose} {...rest} />}
    </Modal>
  );
}

function favoriteAmount(food: Food) {
  return food.quick_add_amount && food.quick_add_amount > 0 ? food.quick_add_amount : food.base_amount;
}

function FavoriteForm({ editing, foods, onEnsureFood, onSave, onClose }: Omit<FavoriteModalProps, "isOpen">) {
  const [selected, setSelected] = useState<Pickable | null>(editing ? fromFood(editing) : null);
  const [amount, setAmount] = useState(editing ? String(favoriteAmount(editing)) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNum = Number(amount.replace(",", ".")) || 0;

  async function save() {
    if (!selected || amountNum <= 0) return;
    setSaving(true);
    setError(null);
    const food = selected.food ?? (selected.lib ? await onEnsureFood(selected.lib) : null);
    const ok = !!food && (await onSave(food, amountNum));
    setSaving(false);
    if (ok) onClose();
    else setError("Couldn't save. Try again.");
  }

  if (!selected) {
    return (
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
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <AmountPicker
        item={selected}
        amount={amount}
        onAmountChange={setAmount}
        onChange={editing ? undefined : () => setSelected(null)}
      />
      <p className="text-xs text-[var(--muted)]">This is the amount logged when you tap + on Quick add.</p>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={amountNum <= 0 || saving}
        className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40"
      >
        {saving ? "Saving…" : editing ? "Save" : "Add to Quick add"}
      </button>
    </form>
  );
}
