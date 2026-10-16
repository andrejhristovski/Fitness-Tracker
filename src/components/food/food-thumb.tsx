import { imageSrc } from "@/lib/meals";

/** Round food picture, or the food's first letter when it has none. */
export function FoodThumb({ name, path, size = 40 }: { name: string; path: string | null; size?: number }) {
  const src = imageSrc(path);
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--card-hover)] font-semibold text-[var(--muted)]"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- small static assets from /public
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        name.trim().charAt(0).toUpperCase() || "?"
      )}
    </div>
  );
}
