"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserSettings } from "@/types/database";
import { MACRO_COLORS } from "@/lib/macro-colors";

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

const n = (v: string) => Number(v.replace(",", ".")) || 0;

function Group({ title, hint, children }: { title: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{title}</h2>
      <div className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        {children}
      </div>
      {hint && <div className="mt-2 px-1 text-xs text-[var(--muted)]">{hint}</div>}
    </section>
  );
}

function Row({
  id,
  label,
  unit,
  value,
  placeholder,
  dot,
  onChange,
}: {
  id: keyof FormState;
  label: string;
  unit: string;
  value: string;
  placeholder?: string;
  dot?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 px-4 py-3">
      <span className="flex flex-1 items-center gap-2 text-sm">
        {dot && <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: dot }} />}
        {label}
      </span>
      <span className="flex items-center gap-1.5">
        <input
          id={id}
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 rounded-lg bg-[var(--background)] px-2.5 py-1.5 text-right font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-[var(--muted)] focus:ring-1 focus:ring-[var(--accent)]"
        />
        <span className="w-8 text-xs text-[var(--muted)]">{unit}</span>
      </span>
    </label>
  );
}

export function SettingsForm({ userId, initialSettings }: SettingsFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(initialSettings));
  const [saved, setSaved] = useState<FormState>(() => toFormState(initialSettings));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setStatus(null);
  }

  // Macros → calories (4 / 4 / 9 kcal per gram).
  const macroKcal = Math.round(n(form.protein_goal) * 4 + n(form.carbs_goal) * 4 + n(form.fats_goal) * 9);
  const calorieGap = macroKcal - n(form.calories_goal);
  const weight = n(form.current_weight_kg);
  const suggestedProtein = weight > 0 ? Math.round(weight * 2) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    const { error } = await createClient().from("user_settings").upsert(
      {
        user_id: userId,
        height_cm: form.height_cm ? n(form.height_cm) : null,
        current_weight_kg: form.current_weight_kg ? n(form.current_weight_kg) : null,
        target_weight_kg: form.target_weight_kg ? n(form.target_weight_kg) : null,
        calories_goal: Math.round(n(form.calories_goal)) || 2000,
        protein_goal: Math.round(n(form.protein_goal)) || 150,
        carbs_goal: Math.round(n(form.carbs_goal)) || 250,
        fats_goal: Math.round(n(form.fats_goal)) || 65,
      },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) {
      setStatus({ ok: false, text: `Couldn't save: ${error.message}` });
      return;
    }
    setSaved(form);
    setStatus({ ok: true, text: "Saved" });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Group
        title="Daily goals"
        hint={
          Math.abs(calorieGap) > 50 ? (
            <span>
              Your macros add up to <span className="font-semibold text-[var(--foreground)]">{macroKcal.toLocaleString()} kcal</span>{" "}
              ({calorieGap > 0 ? "+" : "−"}
              {Math.abs(calorieGap)} vs your calorie goal).{" "}
              <button
                type="button"
                onClick={() => update("calories_goal", String(macroKcal))}
                className="font-medium text-[var(--accent)] hover:underline"
              >
                Use {macroKcal.toLocaleString()}
              </button>
            </span>
          ) : (
            "Shown as the ring and bars on the Food page."
          )
        }
      >
        <Row id="calories_goal" label="Calories" unit="kcal" value={form.calories_goal} onChange={(v) => update("calories_goal", v)} />
        <Row id="protein_goal" label="Protein" unit="g" dot={MACRO_COLORS.protein} value={form.protein_goal} onChange={(v) => update("protein_goal", v)} />
        <Row id="carbs_goal" label="Carbs" unit="g" dot={MACRO_COLORS.carbs} value={form.carbs_goal} onChange={(v) => update("carbs_goal", v)} />
        <Row id="fats_goal" label="Fats" unit="g" dot={MACRO_COLORS.fats} value={form.fats_goal} onChange={(v) => update("fats_goal", v)} />
      </Group>

      <Group
        title="Body"
        hint={
          suggestedProtein && suggestedProtein !== Math.round(n(form.protein_goal)) ? (
            <span>
              For muscle gain, about 2 g protein per kg is a common target ({suggestedProtein} g for you).{" "}
              <button
                type="button"
                onClick={() => update("protein_goal", String(suggestedProtein))}
                className="font-medium text-[var(--accent)] hover:underline"
              >
                Use {suggestedProtein} g
              </button>
            </span>
          ) : (
            "Target weight is used on the Stats page to show how far you have to go."
          )
        }
      >
        <Row id="current_weight_kg" label="Current weight" unit="kg" placeholder="75" value={form.current_weight_kg} onChange={(v) => update("current_weight_kg", v)} />
        <Row id="target_weight_kg" label="Target weight" unit="kg" placeholder="72" value={form.target_weight_kg} onChange={(v) => update("target_weight_kg", v)} />
        <Row id="height_cm" label="Height" unit="cm" placeholder="175" value={form.height_cm} onChange={(v) => update("height_cm", v)} />
      </Group>

      <div className="space-y-2">
        <button
          type="submit"
          disabled={saving || !dirty}
          className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40"
        >
          {saving ? "Saving…" : dirty ? "Save changes" : "All changes saved"}
        </button>
        {status && (
          <p role="status" className={`text-center text-sm ${status.ok ? "text-[var(--accent)]" : "text-red-400"}`}>
            {status.text}
          </p>
        )}
      </div>
    </form>
  );
}
