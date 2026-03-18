"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Food, FoodEntry } from "@/types/database";
import { Modal } from "@/components/ui/modal";
import { calculateNutrition } from "@/lib/food-utils";
import { NutritionPreview } from "./nutrition-preview";
import { FoodImagePicker } from "./food-image-picker";

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  logDate: string;
  foods: Food[];
  prefilledFood?: Food | null;
  /** When set (e.g. from Most used), prefill amount in grams */
  prefilledAmount?: number | null;
  onAdded: (entry: FoodEntry) => void;
  onOpenNewFoodType?: () => void;
}

type Mode = "template" | "custom";

export function AddMealModal({
  isOpen,
  onClose,
  logDate,
  foods,
  prefilledFood,
  prefilledAmount,
  onAdded,
  onOpenNewFoodType,
}: AddMealModalProps) {
  const [mode, setMode] = useState<Mode>("template");
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [customName, setCustomName] = useState("");
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFats, setCustomFats] = useState("");
  const [selectedImagePath, setSelectedImagePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedFood = foods.find((f) => f.id === selectedFoodId);
  const amountNum = Number(amount) || 0;
  const calculated =
    mode === "template" && selectedFood && amountNum > 0
      ? calculateNutrition(selectedFood, amountNum)
      : null;

  useEffect(() => {
    if (isOpen) {
      setMode(prefilledFood ? "template" : "template");
      setSelectedFoodId(prefilledFood?.id ?? foods[0]?.id ?? "");
      setAmount(
        prefilledAmount != null && prefilledAmount > 0
          ? String(prefilledAmount)
          : ""
      );
      setCustomName("");
      setCustomCalories("");
      setCustomProtein("");
      setCustomCarbs("");
      setCustomFats("");
      setSelectedImagePath(prefilledFood?.image_path ?? null);
    }
  }, [isOpen, prefilledFood, prefilledAmount, foods]);

  useEffect(() => {
    if (isOpen && prefilledFood && !selectedFoodId) setSelectedFoodId(prefilledFood.id);
  }, [isOpen, prefilledFood, selectedFoodId]);

  const resetAndClose = () => {
    setAmount("");
    setCustomName("");
    setCustomCalories("");
    setCustomProtein("");
    setCustomCarbs("");
    setCustomFats("");
    setSelectedImagePath(null);
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

    if (mode === "template" && selectedFood && amountNum > 0) {
      const nutrition = calculateNutrition(selectedFood, amountNum);
      const { data, error } = await supabase
        .from("food_entries")
        .insert({
          user_id: user.id,
          food_id: selectedFood.id,
          name: selectedFood.name,
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fats: nutrition.fats,
          quantity: amountNum,
          log_date: logDate,
          image_path: selectedImagePath || null,
        })
        .select()
        .single();
      if (!error && data) {
        onAdded(data);
        resetAndClose();
      }
      setLoading(false);
      return;
    }

    if (mode === "custom") {
      const cal = Number(customCalories) || 0;
      const p = Number(customProtein) || 0;
      const c = Number(customCarbs) || 0;
      const f = Number(customFats) || 0;
      const { data, error } = await supabase
        .from("food_entries")
        .insert({
          user_id: user.id,
          food_id: null,
          name: customName.trim() || "Custom",
          calories: cal,
          protein: p,
          carbs: c,
          fats: f,
          quantity: 1,
          log_date: logDate,
          image_path: selectedImagePath || null,
        })
        .select()
        .single();
      setLoading(false);
      if (!error && data) {
        onAdded(data);
        resetAndClose();
      }
    }
  }

  const canSubmitTemplate =
    mode === "template" && selectedFoodId && amountNum > 0;
  const canSubmitCustom =
    mode === "custom" && customName.trim();

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="Add meal">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2 rounded-xl bg-[var(--background)] p-1">
          <button
            type="button"
            onClick={() => setMode("template")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === "template"
                ? "bg-[var(--card)] text-[var(--foreground)] shadow"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            From food type
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === "custom"
                ? "bg-[var(--card)] text-[var(--foreground)] shadow"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Custom entry
          </button>
        </div>

        {mode === "template" && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--muted)]">
                Food type
              </label>
              <select
                value={selectedFoodId}
                onChange={(e) => setSelectedFoodId(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                <option value="">Select…</option>
                {foods.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} (per {f.base_amount}{f.base_unit})
                  </option>
                ))}
              </select>
              {onOpenNewFoodType && (
                <button
                  type="button"
                  onClick={onOpenNewFoodType}
                  className="mt-2 text-sm font-medium text-[var(--accent)] hover:underline"
                >
                  + New food type
                </button>
              )}
            </div>
            <div>
              <label htmlFor="add-meal-amount" className="mb-1 block text-sm font-medium text-[var(--muted)]">
                Amount ({selectedFood?.base_unit ?? "g"})
              </label>
              <input
                id="add-meal-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 150"
                min={0.1}
                step={0.1}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            {calculated && (
              <NutritionPreview
                calories={calculated.calories}
                protein={calculated.protein}
                carbs={calculated.carbs}
                fats={calculated.fats}
              />
            )}
            <FoodImagePicker
              value={selectedImagePath}
              onChange={setSelectedImagePath}
            />
          </>
        )}

        {mode === "custom" && (
          <>
            <div>
              <label htmlFor="custom-name" className="mb-1 block text-sm font-medium text-[var(--muted)]">
                Name
              </label>
              <input
                id="custom-name"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Restaurant meal"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--muted)]">Total nutrition</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <input
                  type="number"
                  value={customCalories}
                  onChange={(e) => setCustomCalories(e.target.value)}
                  placeholder="Cal"
                  min={0}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <input
                  type="number"
                  value={customProtein}
                  onChange={(e) => setCustomProtein(e.target.value)}
                  placeholder="Protein (g)"
                  min={0}
                  step={0.1}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <input
                  type="number"
                  value={customCarbs}
                  onChange={(e) => setCustomCarbs(e.target.value)}
                  placeholder="Carbs (g)"
                  min={0}
                  step={0.1}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <input
                  type="number"
                  value={customFats}
                  onChange={(e) => setCustomFats(e.target.value)}
                  placeholder="Fats (g)"
                  min={0}
                  step={0.1}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            </div>
            <FoodImagePicker
              value={selectedImagePath}
              onChange={setSelectedImagePath}
            />
          </>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={resetAndClose}
            className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 font-medium transition-colors hover:bg-[var(--card-hover)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              loading ||
              (mode === "template" ? !canSubmitTemplate : !canSubmitCustom)
            }
            className="flex-1 rounded-xl bg-[var(--accent)] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? "Saving…" : "Add meal"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
