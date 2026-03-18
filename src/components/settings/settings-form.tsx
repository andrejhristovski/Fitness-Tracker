"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserSettings } from "@/types/database";

interface SettingsFormProps {
  userId: string;
  initialSettings: UserSettings | null;
}

type FormState = {
  height_cm: string;
  current_weight_kg: string;
  target_weight_kg: string;
  calories_goal: string;
  protein_goal: string;
  carbs_goal: string;
  fats_goal: string;
};

function toFormState(s: UserSettings | null): FormState {
  if (!s) {
    return {
      height_cm: "",
      current_weight_kg: "",
      target_weight_kg: "",
      calories_goal: "2000",
      protein_goal: "150",
      carbs_goal: "250",
      fats_goal: "65",
    };
  }
  return {
    height_cm: s.height_cm != null ? String(s.height_cm) : "",
    current_weight_kg: s.current_weight_kg != null ? String(s.current_weight_kg) : "",
    target_weight_kg: s.target_weight_kg != null ? String(s.target_weight_kg) : "",
    calories_goal: String(s.calories_goal),
    protein_goal: String(s.protein_goal),
    carbs_goal: String(s.carbs_goal),
    fats_goal: String(s.fats_goal),
  };
}

export function SettingsForm({ userId, initialSettings }: SettingsFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(initialSettings));
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    const supabase = createClient();
    const { error } = await supabase.from("user_settings").upsert(
      {
        user_id: userId,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        current_weight_kg: form.current_weight_kg ? Number(form.current_weight_kg) : null,
        target_weight_kg: form.target_weight_kg ? Number(form.target_weight_kg) : null,
        calories_goal: Number(form.calories_goal) || 2000,
        protein_goal: Number(form.protein_goal) || 150,
        carbs_goal: Number(form.carbs_goal) || 250,
        fats_goal: Number(form.fats_goal) || 65,
      },
      { onConflict: "user_id" }
    );

    setSaving(false);
    if (error) return;
    setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Body */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          Body
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="height_cm" className="mb-1 block text-sm font-medium text-[var(--muted)]">
              Height (cm)
            </label>
            <input
              id="height_cm"
              type="number"
              value={form.height_cm}
              onChange={(e) => updateField("height_cm", e.target.value)}
              placeholder="e.g. 175"
              min={0}
              step={0.1}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label htmlFor="current_weight_kg" className="mb-1 block text-sm font-medium text-[var(--muted)]">
              Current weight (kg)
            </label>
            <input
              id="current_weight_kg"
              type="number"
              value={form.current_weight_kg}
              onChange={(e) => updateField("current_weight_kg", e.target.value)}
              placeholder="e.g. 75"
              min={0}
              step={0.1}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label htmlFor="target_weight_kg" className="mb-1 block text-sm font-medium text-[var(--muted)]">
              Target weight (kg)
            </label>
            <input
              id="target_weight_kg"
              type="number"
              value={form.target_weight_kg}
              onChange={(e) => updateField("target_weight_kg", e.target.value)}
              placeholder="e.g. 72"
              min={0}
              step={0.1}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>
      </section>

      {/* Nutrition Goals */}
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--muted)]">
          Nutrition goals
        </h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Used for daily progress on the Food page.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="calories_goal" className="mb-1 block text-sm font-medium text-[var(--muted)]">
              Calories (kcal)
            </label>
            <input
              id="calories_goal"
              type="number"
              value={form.calories_goal}
              onChange={(e) => updateField("calories_goal", e.target.value)}
              min={0}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label htmlFor="protein_goal" className="mb-1 block text-sm font-medium text-[var(--muted)]">
              Protein (g)
            </label>
            <input
              id="protein_goal"
              type="number"
              value={form.protein_goal}
              onChange={(e) => updateField("protein_goal", e.target.value)}
              min={0}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label htmlFor="carbs_goal" className="mb-1 block text-sm font-medium text-[var(--muted)]">
              Carbs (g)
            </label>
            <input
              id="carbs_goal"
              type="number"
              value={form.carbs_goal}
              onChange={(e) => updateField("carbs_goal", e.target.value)}
              min={0}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label htmlFor="fats_goal" className="mb-1 block text-sm font-medium text-[var(--muted)]">
              Fats (g)
            </label>
            <input
              id="fats_goal"
              type="number"
              value={form.fats_goal}
              onChange={(e) => updateField("fats_goal", e.target.value)}
              min={0}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>
      </section>

      {/* Save + feedback */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {success && (
          <p className="text-sm font-medium text-[var(--accent)]" role="status">
            Settings saved.
          </p>
        )}
        <div className="flex-1" />
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-[var(--accent)] px-6 py-3 font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50 sm:w-auto"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
