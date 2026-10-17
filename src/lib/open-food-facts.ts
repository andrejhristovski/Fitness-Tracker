import type { LibraryFood } from "@/lib/food-library";

/** A scanned product, shaped like a library food (nutrition per 100 g / 100 ml). */
export type ScannedFood = LibraryFood & { barcode: string };

type OffProduct = {
  product_name?: string;
  generic_name?: string;
  brands?: string;
  serving_quantity?: number | string;
  product_quantity_unit?: string;
  image_front_small_url?: string;
  nutriments?: Record<string, number | string | undefined>;
};

const num = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Look up a barcode in Open Food Facts (free, open database: world.openfoodfacts.org).
 * Returns null when the product is unknown or has no calorie data.
 */
export async function lookupBarcode(barcode: string): Promise<ScannedFood | null> {
  const code = barcode.replace(/\D/g, "");
  if (code.length < 6) return null;
  const fields = "product_name,generic_name,brands,serving_quantity,product_quantity_unit,image_front_small_url,nutriments";
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${fields}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { status?: number; product?: OffProduct };
  const p = data.product;
  if (!data.status || !p) return null;

  const n = p.nutriments ?? {};
  const kcal = num(n["energy-kcal_100g"]) ?? (num(n["energy_100g"]) != null ? num(n["energy_100g"])! / 4.184 : null);
  if (kcal == null) return null;

  const baseName = (p.product_name || p.generic_name || "").trim() || `Product ${code}`;
  const brand = p.brands?.split(",")[0]?.trim();
  const name = brand && !baseName.toLowerCase().includes(brand.toLowerCase()) ? `${baseName} (${brand})` : baseName;
  const unit = p.product_quantity_unit?.toLowerCase() === "ml" ? "ml" : "g";
  const serving = num(p.serving_quantity);

  return {
    barcode: code,
    name,
    base_amount: 100,
    base_unit: unit,
    calories: Math.round(kcal),
    protein: round1(num(n["proteins_100g"]) ?? 0),
    carbs: round1(num(n["carbohydrates_100g"]) ?? 0),
    fats: round1(num(n["fat_100g"]) ?? 0),
    image_path: p.image_front_small_url ?? null,
    presets: serving && serving > 0 ? [...new Set([Math.round(serving), 50, 100, 150])].sort((a, b) => a - b) : undefined,
  };
}
