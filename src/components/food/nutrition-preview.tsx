"use client";

interface NutritionPreviewProps {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  /** Optional title above the block, e.g. "Calculated nutrition" */
  title?: string;
}

export function NutritionPreview({
  calories,
  protein,
  carbs,
  fats,
  title = "Calculated nutrition",
}: NutritionPreviewProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
        {title}
      </p>
      <p className="mb-3 font-medium text-[var(--accent)]">
        {Math.round(calories)} kcal
      </p>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-lg bg-[var(--background)] px-2 py-1.5 text-center">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
            Protein
          </span>
          <span className="font-medium text-[var(--foreground)]">
            {protein.toFixed(0)}g
          </span>
        </div>
        <div className="rounded-lg bg-[var(--background)] px-2 py-1.5 text-center">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
            Carbs
          </span>
          <span className="font-medium text-[var(--foreground)]">
            {carbs.toFixed(0)}g
          </span>
        </div>
        <div className="rounded-lg bg-[var(--background)] px-2 py-1.5 text-center">
          <span className="block text-[10px] font-medium uppercase tracking-wider text-[var(--muted)]">
            Fats
          </span>
          <span className="font-medium text-[var(--foreground)]">
            {fats.toFixed(0)}g
          </span>
        </div>
      </div>
    </div>
  );
}
