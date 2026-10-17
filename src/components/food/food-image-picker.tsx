"use client";

import { FOOD_ICONS, FOOD_ICON_KEYS, FoodIcon, guessFoodIcon, iconPath } from "@/lib/food-icons";

interface FoodImagePickerProps {
  /** "icon:<key>", or null for automatic (guessed from the food's name). */
  value: string | null;
  onChange: (path: string | null) => void;
  /** Food name, used to preview the automatic icon. */
  name?: string;
  label?: string;
}

export function FoodImagePicker({ value, onChange, name = "", label = "Icon" }: FoodImagePickerProps) {
  const auto = guessFoodIcon(name);
  const tile = (selected: boolean) =>
    `flex size-11 shrink-0 items-center justify-center rounded-xl border-2 transition-colors ${
      selected ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--muted)]"
    }`;

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[var(--muted)]">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => onChange(null)} className={tile(value === null)} title="Automatic" aria-label="Automatic icon">
          <span className="flex flex-col items-center leading-none" style={{ color: FOOD_ICONS[auto].color }}>
            <FoodIcon icon={auto} className="h-5 w-5" />
            <span className="mt-0.5 text-[9px] text-[var(--muted)]">Auto</span>
          </span>
        </button>
        {FOOD_ICON_KEYS.map((key) => {
          const path = iconPath(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(value === path ? null : path)}
              className={tile(value === path)}
              title={FOOD_ICONS[key].label}
              aria-label={FOOD_ICONS[key].label}
              style={{ color: FOOD_ICONS[key].color }}
            >
              <FoodIcon icon={key} className="h-6 w-6" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
