import { FOOD_ICONS, FoodIcon, resolveFoodImage } from "@/lib/food-icons";

/** Round food picture: a minimal icon (tinted per food), or a scanned product's photo. */
export function FoodThumb({ name, path, size = 40 }: { name: string; path: string | null; size?: number }) {
  const image = resolveFoodImage(name, path);

  if ("url" in image) {
    return (
      <div className="shrink-0 overflow-hidden rounded-full bg-white" style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- small product photo from Open Food Facts */}
        <img src={image.url} alt="" loading="lazy" className="h-full w-full object-cover" />
      </div>
    );
  }

  const color = FOOD_ICONS[image.icon].color;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      <FoodIcon icon={image.icon} className="h-[55%] w-[55%]" />
    </div>
  );
}
