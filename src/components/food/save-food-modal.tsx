"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Food } from "@/types/database";
import { Modal } from "@/components/ui/modal";

interface SaveFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (food: Food) => void;
}

const DEFAULT_BASE_AMOUNT = 100;
const DEFAULT_BASE_UNIT = "g";

export function SaveFoodModal({ isOpen, onClose, onSaved }: SaveFoodModalProps) {
  const [name, setName] = useState("");
  const [baseAmount, setBaseAmount] = useState(String(DEFAULT_BASE_AMOUNT));
  const [baseUnit, setBaseUnit] = useState(DEFAULT_BASE_UNIT);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setBaseAmount(String(DEFAULT_BASE_AMOUNT));
    setBaseUnit(DEFAULT_BASE_UNIT);
    setCalories("");
    setProtein("");
    setCarbs("");
    setFats("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("foods")
      .insert({
        user_id: user.id,
        name: name.trim(),
        base_amount: Number(baseAmount) || DEFAULT_BASE_AMOUNT,
        base_unit: baseUnit.trim() || DEFAULT_BASE_UNIT,
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fats: Number(fats) || 0,
      })
      .select()
      .single();

    setLoading(false);
    if (error) return;
    if (data) {
      onSaved({
        ...data,
        is_quick_add: Boolean(data.is_quick_add),
        quick_add_amount: data.quick_add_amount != null ? Number(data.quick_add_amount) : null,
      });
      handleClose();
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New food type">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="save-food-name" className="mb-1 block text-sm font-medium text-[var(--muted)]">
            Name
          </label>
          <input
            id="save-food-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chicken breast"
            required
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
              Per amount
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={baseAmount}
                onChange={(e) => setBaseAmount(e.target.value)}
                placeholder="100"
                min={0.1}
                step={0.1}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              <input
                type="text"
                value={baseUnit}
                onChange={(e) => setBaseUnit(e.target.value)}
                placeholder="g"
                className="w-14 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-center focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">Nutrition values below are per this amount.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--muted)]">Calories (kcal)</label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="0"
              min={0}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--muted)]">Macros (g) per {baseAmount || "—"}{baseUnit}</p>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="Protein"
              min={0}
              step={0.1}
              className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <input
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="Carbs"
              min={0}
              step={0.1}
              className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <input
              type="number"
              value={fats}
              onChange={(e) => setFats(e.target.value)}
              placeholder="Fats"
              min={0}
              step={0.1}
              className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 font-medium transition-colors hover:bg-[var(--card-hover)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? "Saving…" : "Create food type"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
