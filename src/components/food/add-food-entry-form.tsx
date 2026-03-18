"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Food, FoodEntry } from "@/types/database";

interface AddFoodEntryFormProps {
  logDate: string;
  frequentFoods: Food[];
  onAdded: (entry: FoodEntry) => void;
}

export function AddFoodEntryForm({
  logDate,
  frequentFoods,
  onAdded,
}: AddFoodEntryFormProps) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function selectFrequentFood(food: Food) {
    setSelectedFoodId(food.id);
    setName(food.name);
    setCalories(String(food.calories));
    setProtein(String(food.protein));
    setCarbs(String(food.carbs));
    setFats(String(food.fats));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("food_entries")
      .insert({
        user_id: user.id,
        food_id: selectedFoodId || null,
        name: name.trim(),
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fats: Number(fats) || 0,
        quantity: Number(quantity) || 1,
        log_date: logDate,
      })
      .select()
      .single();

    setLoading(false);
    if (error) return;
    if (data) onAdded(data);
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFats("");
    setQuantity("1");
    setSelectedFoodId(null);
  }

  return (
    <div className="space-y-4">
      {frequentFoods.length > 0 && (
        <div>
          <p className="mb-2 text-xs text-[var(--muted)]">Quick add</p>
          <div className="flex flex-wrap gap-2">
            {frequentFoods.map((food) => (
              <button
                key={food.id}
                type="button"
                onClick={() => selectFrequentFood(food)}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm hover:bg-[var(--card-hover)]"
              >
                {food.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Food name"
          required
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="Cal"
            min={0}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <input
            type="number"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder="Protein (g)"
            min={0}
            step={0.1}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <input
            type="number"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            placeholder="Carbs (g)"
            min={0}
            step={0.1}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <input
            type="number"
            value={fats}
            onChange={(e) => setFats(e.target.value)}
            placeholder="Fats (g)"
            min={0}
            step={0.1}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Qty"
            min={0.1}
            step={0.1}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {loading ? "Adding…" : "Add entry"}
        </button>
      </form>
    </div>
  );
}
