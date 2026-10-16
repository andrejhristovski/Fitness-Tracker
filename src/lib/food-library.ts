/**
 * Built-in foods with typical nutrition values (USDA-style averages). Brands differ,
 * so these are good starting points — users can still create their own food types.
 * Values are per `base_amount` `base_unit` (100 g / 100 ml, or one piece).
 */

export interface LibraryFood {
  name: string;
  base_amount: number;
  base_unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  image_path: string | null;
  /** Typical portions for the quick amount buttons. */
  presets?: number[];
}

const IMG = "/assets/images/foods";

const f = (
  name: string,
  base_amount: number,
  base_unit: string,
  [calories, protein, carbs, fats]: [number, number, number, number],
  image: string | null = null,
  presets?: number[]
): LibraryFood => ({
  name,
  base_amount,
  base_unit,
  calories,
  protein,
  carbs,
  fats,
  image_path: image ? `${IMG}/${image}` : null,
  presets,
});

export const FOOD_LIBRARY: LibraryFood[] = [
  // Breakfast & grains
  f("Oats", 100, "g", [379, 13.2, 67.7, 6.5], "Oatmeal.jpg", [40, 50, 60, 80, 100]),
  f("Granola", 100, "g", [471, 10, 64, 20], "Oatmeal.jpg", [30, 50, 70]),
  f("Corn flakes", 100, "g", [357, 7.5, 84, 0.4], null, [30, 40, 60]),
  f("White bread", 1, "slice", [80, 2.7, 15, 1], "Bread.jpg"),
  f("Whole wheat bread", 1, "slice", [80, 4, 13.8, 1.1], "Bread.jpg"),
  f("Rice cake", 1, "cake", [35, 0.7, 7.3, 0.3], null),
  f("Rice (dry)", 100, "g", [360, 6.6, 79, 0.6], "Rice.jpg", [50, 75, 100, 125]),
  f("Rice (cooked)", 100, "g", [130, 2.7, 28, 0.3], "Rice.jpg"),
  f("Pasta (dry)", 100, "g", [371, 13, 75, 1.5], "Pasta.jpg", [60, 80, 100, 125]),
  f("Pasta (cooked)", 100, "g", [158, 5.8, 31, 0.9], "Pasta.jpg"),
  f("Potato", 100, "g", [77, 2, 17, 0.1], null),
  f("Sweet potato", 100, "g", [86, 1.6, 20, 0.1], null),

  // Protein
  f("Whey protein", 100, "g", [400, 80, 8, 6], null, [25, 30, 40, 50]),
  f("Egg", 1, "egg", [72, 6.3, 0.4, 4.8], "Eggs.jpg"),
  f("Egg white", 1, "egg white", [17, 3.6, 0.2, 0.1], "Eggs.jpg"),
  f("Chicken breast (raw)", 100, "g", [120, 22.5, 0, 2.6], "Chicken.jpg", [100, 150, 200, 250]),
  f("Chicken breast (cooked)", 100, "g", [165, 31, 0, 3.6], "Chicken.jpg", [100, 150, 200, 250]),
  f("Turkey breast (raw)", 100, "g", [114, 23.7, 0, 1.5], "Chicken.jpg", [100, 150, 200]),
  f("Tuna in water (drained)", 100, "g", [116, 25.5, 0, 0.8], "Tuna.jpg", [80, 100, 120, 160]),
  f("Tuna in oil (drained)", 100, "g", [198, 29, 0, 8.2], "Tuna.jpg", [80, 100, 120, 160]),
  f("Salmon (raw)", 100, "g", [208, 20, 0, 13], "Fish.jpg", [100, 125, 150, 200]),
  f("White fish / cod (raw)", 100, "g", [82, 18, 0, 0.7], "Fish.jpg", [100, 150, 200]),
  f("Beef mince 5% (raw)", 100, "g", [137, 21, 0, 5], null, [100, 125, 150, 200]),
  f("Beef mince 10% (raw)", 100, "g", [176, 20, 0, 10], null, [100, 125, 150, 200]),
  f("Lean ham", 100, "g", [120, 21, 1, 3.5], null, [30, 50, 75, 100]),
  f("Tofu (firm)", 100, "g", [144, 15.8, 2.8, 8.7], null),
  f("Protein bar", 1, "bar", [210, 20, 22, 7], null),

  // Dairy
  f("Milk 1.5%", 100, "ml", [47, 3.4, 4.9, 1.5], null, [100, 200, 250, 300]),
  f("Milk 3.5%", 100, "ml", [64, 3.3, 4.8, 3.6], null, [100, 200, 250, 300]),
  f("Greek yogurt 0%", 100, "g", [59, 10.3, 3.6, 0.4], null, [150, 170, 200, 250]),
  f("Greek yogurt 2%", 100, "g", [73, 9.9, 3.9, 2], null, [150, 170, 200, 250]),
  f("Skyr", 100, "g", [63, 11, 4, 0.2], null, [150, 200, 250]),
  f("Cottage cheese", 100, "g", [81, 10.5, 4.8, 2.3], "Cottage cheese.jpg", [100, 200, 250]),
  f("Cheese (gouda/cheddar)", 100, "g", [400, 25, 1.3, 33], null, [20, 30, 50]),
  f("Feta", 100, "g", [264, 14, 4, 21], null, [30, 50, 100]),

  // Fruit & veg
  f("Banana", 1, "banana", [105, 1.3, 27, 0.4], "Banana.jpg"),
  f("Apple", 1, "apple", [95, 0.5, 25, 0.3], null),
  f("Orange", 1, "orange", [62, 1.2, 15.4, 0.2], null),
  f("Blueberries", 100, "g", [57, 0.7, 14.5, 0.3], null, [50, 100, 150]),
  f("Strawberries", 100, "g", [32, 0.7, 7.7, 0.3], null, [100, 150, 200]),
  f("Avocado", 100, "g", [160, 2, 8.5, 14.7], null, [50, 75, 100]),
  f("Broccoli", 100, "g", [34, 2.8, 7, 0.4], "Salad.jpg"),
  f("Spinach", 100, "g", [23, 2.9, 3.6, 0.4], "Salad.jpg"),
  f("Mixed salad", 100, "g", [17, 1.2, 3.3, 0.2], "Salad.jpg"),
  f("Tomato", 100, "g", [18, 0.9, 3.9, 0.2], "Salad.jpg"),
  f("Cucumber", 100, "g", [15, 0.7, 3.6, 0.1], "Salad.jpg"),

  // Legumes
  f("Lentils (cooked)", 100, "g", [116, 9, 20, 0.4], null),
  f("Chickpeas (cooked)", 100, "g", [164, 8.9, 27.4, 2.6], null),
  f("Kidney beans (cooked)", 100, "g", [127, 8.7, 22.8, 0.5], null),

  // Fats, nuts & extras
  f("Peanut butter", 100, "g", [588, 25, 20, 50], null, [15, 20, 30]),
  f("Almonds", 100, "g", [579, 21, 22, 50], null, [15, 20, 30]),
  f("Walnuts", 100, "g", [654, 15, 14, 65], null, [15, 20, 30]),
  f("Olive oil", 100, "g", [884, 0, 0, 100], null, [5, 10, 15]),
  f("Butter", 100, "g", [717, 0.9, 0.1, 81], null, [5, 10, 15]),
  f("Honey", 100, "g", [304, 0.3, 82, 0], null, [10, 15, 20]),
  f("Dark chocolate 70%", 100, "g", [598, 7.8, 46, 43], null, [10, 20, 25]),

  // Ready food & drinks
  f("French fries", 100, "g", [312, 3.4, 41, 15], "French Fries.jpg", [100, 150, 200]),
  f("Pizza", 100, "g", [266, 11, 33, 10], null, [150, 250, 400]),
  f("Orange juice", 100, "ml", [45, 0.7, 10.4, 0.2], null, [200, 250, 330]),
  f("Cola", 100, "ml", [42, 0, 10.6, 0], null, [250, 330, 500]),
];

const BY_NAME = new Map(FOOD_LIBRARY.map((x) => [x.name.toLowerCase(), x]));

export function findLibraryFood(name: string) {
  return BY_NAME.get(name.trim().toLowerCase());
}
