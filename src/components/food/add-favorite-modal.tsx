"use client";

import { useState, useEffect } from "react";
import type { Food } from "@/types/database";
import { Modal } from "@/components/ui/modal";
import {
  saveFavoriteFromTemplate,
  saveFavoriteCustom,
} from "@/app/actions/food-actions";
import { calculateNutrition } from "@/lib/food-utils";
import { NutritionPreview } from "./nutrition-preview";
import { FoodImagePicker } from "./food-image-picker";

interface AddFavoriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  foods: Food[];
  onSaved: (food: Food) => void;
  onOpenNewFoodType?: () => void;
  /** When set, modal opens in edit mode with this food prefilled */
  editingFood?: Food | null;
}

type Mode = "template" | "custom";

export function AddFavoriteModal({
  isOpen,
  onClose,
  foods,
  onSaved,
  onOpenNewFoodType,
  editingFood = null,
}: AddFavoriteModalProps) {
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
  const [error, setError] = useState<string | null>(null);

  const selectedFood = foods.find((f) => f.id === selectedFoodId);
  const amountNum = Number(amount) || 0;
  const calculated =
    mode === "template" && selectedFood
      ? calculateNutrition(
          selectedFood,
          amountNum > 0 ? amountNum : selectedFood.base_amount
        )
      : null;

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setMode("template");
      if (editingFood) {
        setSelectedFoodId(editingFood.id);
        setAmount(
          editingFood.quick_add_amount != null && editingFood.quick_add_amount > 0
            ? String(editingFood.quick_add_amount)
            : ""
        );
        setSelectedImagePath(editingFood.image_path ?? null);
      } else {
        setSelectedFoodId(foods[0]?.id ?? "");
        setAmount("");
        setSelectedImagePath(null);
      }
      setCustomName("");
      setCustomCalories("");
      setCustomProtein("");
      setCustomCarbs("");
      setCustomFats("");
    }
  }, [isOpen, foods, editingFood?.id]);

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
    setError(null);
    setLoading(true);
    try {
      if (mode === "template" && selectedFood) {
        const defaultAmount = amountNum > 0 ? amountNum : selectedFood.base_amount;
        const result = await saveFavoriteFromTemplate(selectedFood.id, defaultAmount, selectedImagePath);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onSaved(result.data);
        resetAndClose();
        return;
      }

      if (mode === "custom" && customName.trim()) {
        const result = await saveFavoriteCustom({
          name: customName.trim(),
          calories: Number(customCalories) || 0,
          protein: Number(customProtein) || 0,
          carbs: Number(customCarbs) || 0,
          fats: Number(customFats) || 0,
          image_path: selectedImagePath,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        onSaved(result.data);
        resetAndClose();
      }
    } finally {
      setLoading(false);
    }
  }

  const canSubmitTemplate =
    mode === "template" && selectedFoodId && selectedFood;
  const canSubmitCustom = mode === "custom" && customName.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title={editingFood ? "Edit favorite" : "Add to most used"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}
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
                    {f.is_quick_add ? " · in most used" : ""}
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
            {selectedFood && (
              <div>
                <label htmlFor="fav-amount" className="mb-1 block text-sm font-medium text-[var(--muted)]">
                  Default amount ({selectedFood.base_unit}) when logging
                </label>
                <input
                  id="fav-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={String(selectedFood.base_amount)}
                  min={0.1}
                  step={0.1}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            )}
            {calculated && (
              <NutritionPreview
                calories={calculated.calories}
                protein={calculated.protein}
                carbs={calculated.carbs}
                fats={calculated.fats}
                title="Nutrition for default amount"
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
              <label htmlFor="fav-custom-name" className="mb-1 block text-sm font-medium text-[var(--muted)]">
                Name
              </label>
              <input
                id="fav-custom-name"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. My breakfast"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--muted)]">Nutrition per serving</p>
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
            {loading ? "Saving…" : editingFood ? "Save changes" : "Save as favorite"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
