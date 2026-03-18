"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Food } from "@/types/database";

interface SaveFrequentFoodFormProps {
  onSaved: (food: Food) => void;
}

export function SaveFrequentFoodForm({ onSaved }: SaveFrequentFoodFormProps) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [loading, setLoading] = useState(false);

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
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fats: Number(fats) || 0,
        serving_size: servingSize.trim() || null,
      })
      .select()
      .single();

    setLoading(false);
    if (error) return;
    if (data) {
      onSaved(data);
      setName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFats("");
      setServingSize("");
    }
  }

  return (
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
          placeholder="Calories"
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
          type="text"
          value={servingSize}
          onChange={(e) => setServingSize(e.target.value)}
          placeholder="Serving (e.g. 100g)"
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none sm:col-span-1"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-fit rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2 font-medium hover:bg-[var(--card-hover)] disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save as frequent food"}
      </button>
    </form>
  );
}
