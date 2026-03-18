"use client";

import Image from "next/image";
import { FOOD_IMAGE_PATHS, foodImageLabel } from "@/lib/food-images";

const THUMB_SIZE = 56;

interface FoodImagePickerProps {
  value: string | null;
  onChange: (path: string | null) => void;
  label?: string;
}

export function FoodImagePicker({
  value,
  onChange,
  label = "Choose image",
}: FoodImagePickerProps) {
  return (
    <div>
      <p className="mb-2 block text-sm font-medium text-[var(--muted)]">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`flex size-14 shrink-0 items-center justify-center rounded-xl border-2 text-xs text-[var(--muted)] transition-colors ${
            value === null
              ? "border-[var(--accent)] bg-[var(--accent)]/10"
              : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--muted)]"
          }`}
          title="No image"
        >
          None
        </button>
        {FOOD_IMAGE_PATHS.map((path) => {
          const isSelected = value === path;
          return (
            <button
              key={path}
              type="button"
              onClick={() => onChange(isSelected ? null : path)}
              className={`relative size-14 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                isSelected
                  ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                  : "border-[var(--border)] hover:border-[var(--muted)]"
              }`}
              title={foodImageLabel(path)}
            >
              <Image
                src={path.includes(" ") ? path.split("/").map(encodeURIComponent).join("/") : path}
                alt={foodImageLabel(path)}
                width={THUMB_SIZE}
                height={THUMB_SIZE}
                sizes={`${THUMB_SIZE}px`}
                className="size-full object-cover"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
