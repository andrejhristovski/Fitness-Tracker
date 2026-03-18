/** Available food images in public/assets/images/foods (path = URL under /) */
export const FOOD_IMAGE_PATHS = [
  "/assets/images/foods/Banana.jpg",
  "/assets/images/foods/Bread.jpg",
  "/assets/images/foods/Chicken.jpg",
  "/assets/images/foods/Cottage cheese.jpg",
  "/assets/images/foods/Eggs.jpg",
  "/assets/images/foods/Fish.jpg",
  "/assets/images/foods/French Fries.jpg",
  "/assets/images/foods/Oatmeal.jpg",
  "/assets/images/foods/Pasta.jpg",
  "/assets/images/foods/Rice.jpg",
  "/assets/images/foods/Salad.jpg",
  "/assets/images/foods/Tuna.jpg",
] as const;

export type FoodImagePath = (typeof FOOD_IMAGE_PATHS)[number];

/** Label for display (filename without extension) */
export function foodImageLabel(path: string): string {
  const name = path.replace(/^.*\//, "").replace(/\.(jpe?g|png|webp)$/i, "");
  return name;
}
