/*
 * Minimal line icons for foods (24x24, stroke = currentColor), used instead of photos.
 * A food's image_path is "icon:<key>"; anything else falls back to a guess from the food's name.
 */

export const FOOD_ICON_KEYS = [
  "egg",
  "banana",
  "apple",
  "berries",
  "avocado",
  "salad",
  "potato",
  "bread",
  "bowl",
  "rice",
  "pasta",
  "chicken",
  "meat",
  "fish",
  "can",
  "cheese",
  "yogurt",
  "milk",
  "shaker",
  "bar",
  "nuts",
  "beans",
  "bottle",
  "chocolate",
  "fries",
  "pizza",
  "drink",
  "plate",
] as const;

export type FoodIconKey = (typeof FOOD_ICON_KEYS)[number];

type IconDef = { label: string; color: string; svg: React.ReactNode };

export const FOOD_ICONS: Record<FoodIconKey, IconDef> = {
  egg: {
    label: "Egg",
    color: "#e5c07b",
    svg: <path d="M12 3c-3.3 0-6 5.3-6 9.5A6 6 0 0 0 18 12.5C18 8.3 15.3 3 12 3Z" />,
  },
  banana: {
    label: "Banana",
    color: "#e8c547",
    svg: (
      <>
        <path d="M4 13c2.5 4.5 8.5 6 12.5 3 2.3-1.7 3.4-4.4 3-7.5-1.2 3.3-4.2 5.4-7.7 5.4-3 0-5.5-.7-7.8-.9Z" />
        <path d="M19.5 8.5 20 5.5" />
      </>
    ),
  },
  apple: {
    label: "Apple",
    color: "#e06c6c",
    svg: (
      <>
        <path d="M12 8c-1.8-1.6-7-1.5-7 4.2C5 16.5 7.8 21 10 21c.9 0 1.3-.5 2-.5s1.1.5 2 .5c2.2 0 5-4.5 5-8.8C19 6.5 13.8 6.4 12 8Z" />
        <path d="M12 8c0-2 .8-3.6 2.5-5" />
      </>
    ),
  },
  berries: {
    label: "Berries",
    color: "#7f8fe6",
    svg: (
      <>
        <circle cx="8" cy="14" r="3.5" />
        <circle cx="15.5" cy="15.5" r="3.5" />
        <circle cx="12.5" cy="8.5" r="3" />
      </>
    ),
  },
  avocado: {
    label: "Avocado",
    color: "#8bbf5a",
    svg: (
      <>
        <path d="M12 3c-3 0-4.5 6-6 10a6 6 0 0 0 12 0c-1.5-4-3-10-6-10Z" />
        <circle cx="12" cy="14.5" r="2.5" />
      </>
    ),
  },
  salad: {
    label: "Vegetables",
    color: "#6cbf6c",
    svg: (
      <>
        <path d="M5 19C5 11 10.5 5 19 5c0 8.5-6 14-14 14Z" />
        <path d="M5 19 13 11" />
      </>
    ),
  },
  potato: {
    label: "Potato",
    color: "#c9a26b",
    svg: (
      <>
        <path d="M5.5 15C3 11 6 4.5 12 5c5.5.5 8.5 5 6.5 10-1.6 4-9.6 4.5-13 0Z" />
        <path d="M9 10h.01M14 9h.01M12 14h.01" />
      </>
    ),
  },
  bread: {
    label: "Bread",
    color: "#d4a15f",
    svg: <path d="M6 20V10.6A3.3 3.3 0 0 1 7.5 4h9A3.3 3.3 0 0 1 18 10.6V20Z" />,
  },
  bowl: {
    label: "Bowl / oats",
    color: "#d9b77e",
    svg: (
      <>
        <path d="M3 11h18a9 9 0 0 1-18 0Z" />
        <path d="M8 21h8M8.5 8l1-1.5M12 7.5l1-1.5M15.5 8l1-1.5" />
      </>
    ),
  },
  rice: {
    label: "Rice",
    color: "#cfcfcf",
    svg: (
      <>
        <path d="M3 11h18a9 9 0 0 1-18 0Z" />
        <path d="M5.5 11c1-3 3.5-4.5 6.5-4.5s5.5 1.5 6.5 4.5M8 21h8" />
      </>
    ),
  },
  pasta: {
    label: "Pasta",
    color: "#e2c06b",
    svg: (
      <>
        <path d="M3 11h18a9 9 0 0 1-18 0Z" />
        <path d="M6 8.5c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 3.5-.5M8 21h8" />
      </>
    ),
  },
  chicken: {
    label: "Chicken",
    color: "#d9925b",
    svg: (
      <>
        <path d="M14 3.5a6.5 6.5 0 0 1 4.6 11.1c-1.9 1.9-4.6 2.5-7 1.6L9 18.8" />
        <path d="M14 3.5c-3.6 0-6.5 2.9-6.5 6.5 0 1.3.4 2.6 1.1 3.6l2 2.6" />
        <path d="M9 18.8a1.7 1.7 0 1 1-2.6 2.1 1.7 1.7 0 1 1-1.3-3.2 1.7 1.7 0 1 1 3.9 1.1Z" />
      </>
    ),
  },
  meat: {
    label: "Meat",
    color: "#d46a6a",
    svg: (
      <>
        <path d="M4.5 13.5C3.5 8 8 4 13.5 5c4.5.8 7.5 5 5.5 9.5-1.8 4-8 6.5-11.5 4.5-1.6-.9-2.6-3-3-5.5Z" />
        <circle cx="14" cy="11" r="2" />
      </>
    ),
  },
  fish: {
    label: "Fish",
    color: "#6fb3d9",
    svg: (
      <>
        <path d="M2.5 12C6 7.5 11.5 6 16 9.5L21 6v12l-5-3.5C11.5 18 6 16.5 2.5 12Z" />
        <path d="M7.5 11.5h.01" />
      </>
    ),
  },
  can: {
    label: "Can / tuna",
    color: "#8fa6bf",
    svg: (
      <>
        <ellipse cx="12" cy="8" rx="8" ry="3" />
        <path d="M4 8v8c0 1.7 3.6 3 8 3s8-1.3 8-3V8M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
      </>
    ),
  },
  cheese: {
    label: "Cheese",
    color: "#e8c547",
    svg: (
      <>
        <path d="M3 18v-6.5L15 5l6 6.5V18Z" />
        <path d="M3 11.5h18" />
        <circle cx="9" cy="15" r="1" />
        <circle cx="15.5" cy="14.5" r="1.3" />
      </>
    ),
  },
  yogurt: {
    label: "Yogurt / cottage",
    color: "#e6e6e6",
    svg: (
      <>
        <path d="M5 8h14l-1.5 12h-11Z" />
        <path d="M4 5h16v3H4Z" />
      </>
    ),
  },
  milk: {
    label: "Milk",
    color: "#e6e6e6",
    svg: (
      <>
        <path d="M7 3h10l-1.2 18H8.2Z" />
        <path d="M7.5 9h9" />
      </>
    ),
  },
  shaker: {
    label: "Protein shake",
    color: "#22c55e",
    svg: (
      <>
        <path d="M7 8h10l-1.2 12.2a1 1 0 0 1-1 .8H9.2a1 1 0 0 1-1-.8Z" />
        <path d="M8.5 4h7v4h-7ZM7.5 12h9" />
      </>
    ),
  },
  bar: {
    label: "Protein bar",
    color: "#b58a5c",
    svg: (
      <>
        <rect x="3" y="8" width="18" height="8" rx="2" />
        <path d="M8 8v8M16 8v8" />
      </>
    ),
  },
  nuts: {
    label: "Nuts",
    color: "#c9a26b",
    svg: (
      <>
        <path d="M9 3c3.5 3 4.5 9 0 15C4.5 12 5.5 6 9 3Z" />
        <path d="M16 7c3 2.5 3.8 7.5 0 12.5-3.8-5-3-10 0-12.5Z" />
      </>
    ),
  },
  beans: {
    label: "Beans / lentils",
    color: "#c97b5b",
    svg: (
      <>
        <path d="M6 9c1.5-3 6-3 6.5 0s-1 3.5 1 4.5 2 4.5-1.5 5.5S4 17 5 13c.3-1.4.6-2.6 1-4Z" />
        <path d="M17 4.5c2.5 0 4 2 3.5 4.5s-3 3-4.5 2-1.5-3-1-4.5 1-2 2-2Z" />
      </>
    ),
  },
  bottle: {
    label: "Oil / honey / jar",
    color: "#d9b44a",
    svg: (
      <>
        <path d="M9.5 3h5v3l2.5 3.5V20a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V9.5L9.5 6Z" />
        <path d="M7 13h10" />
      </>
    ),
  },
  chocolate: {
    label: "Chocolate / sweets",
    color: "#a0715a",
    svg: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="1.5" />
        <path d="M5 9h14M5 15h14M12 3v18" />
      </>
    ),
  },
  fries: {
    label: "Fries / fast food",
    color: "#e2b04a",
    svg: (
      <>
        <path d="M5.5 11h13l-1.5 10h-10Z" />
        <path d="M8 11V5M11 11V3.5M14 11V4.5M17 11V7" />
      </>
    ),
  },
  pizza: {
    label: "Pizza",
    color: "#e0955b",
    svg: (
      <>
        <path d="M3 7.5C9 4.5 15 4.5 21 7.5L12 21Z" />
        <path d="M10 10h.01M14 11.5h.01M12 15h.01" />
      </>
    ),
  },
  drink: {
    label: "Drink / juice",
    color: "#e2a05b",
    svg: (
      <>
        <path d="M6 7h12l-1.5 14h-9Z" />
        <path d="M12 7l2.5-4h3M6.5 11h11" />
      </>
    ),
  },
  plate: {
    label: "Meal",
    color: "#9aa0a6",
    svg: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4.5" />
      </>
    ),
  },
};

const ICON_PREFIX = "icon:";

export function iconPath(key: FoodIconKey) {
  return `${ICON_PREFIX}${key}`;
}

// Old photo paths (before icons) → matching icon, so saved foods keep a picture.
const LEGACY_PHOTOS: Record<string, FoodIconKey> = {
  banana: "banana",
  bread: "bread",
  chicken: "chicken",
  "cottage cheese": "yogurt",
  eggs: "egg",
  fish: "fish",
  "french fries": "fries",
  oatmeal: "bowl",
  pasta: "pasta",
  rice: "rice",
  salad: "salad",
  tuna: "can",
};

// First match wins: more specific words first.
const NAME_RULES: [RegExp, FoodIconKey][] = [
  [/whey|protein shake|shake|smoothie/i, "shaker"],
  [/protein bar|\bbar\b/i, "bar"],
  [/egg/i, "egg"],
  [/banana/i, "banana"],
  [/apple/i, "apple"],
  [/berr|grape|cherr/i, "berries"],
  [/avocado/i, "avocado"],
  [/tuna|sardine|\bcan\b|canned/i, "can"],
  [/salmon|fish|cod|shrimp|prawn/i, "fish"],
  [/chicken|turkey|wing|drumstick/i, "chicken"],
  [/beef|steak|mince|pork|ham|bacon|sausage|meat|lamb/i, "meat"],
  [/oat|porridge|granola|cereal|muesli|flakes/i, "bowl"],
  [/rice/i, "rice"],
  [/pasta|spaghetti|noodle|penne/i, "pasta"],
  [/bread|toast|bagel|wrap|tortilla|sandwich|rice cake/i, "bread"],
  [/potato/i, "potato"],
  [/fries|burger|chips/i, "fries"],
  [/pizza/i, "pizza"],
  [/yogurt|yoghurt|skyr|cottage|quark|kefir/i, "yogurt"],
  [/cheese|feta|mozzarella|parmesan/i, "cheese"],
  [/milk/i, "milk"],
  [/peanut butter|nut|almond|walnut|cashew|seed/i, "nuts"],
  [/bean|lentil|chickpea|hummus|tofu|pea\b/i, "beans"],
  [/oil|butter|honey|jam|syrup|sauce/i, "bottle"],
  [/chocolate|cake|cookie|candy|sweet|ice cream/i, "chocolate"],
  [/juice|cola|soda|coffee|tea|drink|beer|wine/i, "drink"],
  [/salad|broccoli|spinach|tomato|cucumber|carrot|vegetable|lettuce|pepper/i, "salad"],
  [/orange|fruit|mango|pear|kiwi|peach/i, "apple"],
];

export function guessFoodIcon(name: string): FoodIconKey {
  return NAME_RULES.find(([re]) => re.test(name))?.[1] ?? "plate";
}

/**
 * What to show for a food: an external photo URL (e.g. a scanned product), or an icon key.
 */
export function resolveFoodImage(name: string, path: string | null): { url: string } | { icon: FoodIconKey } {
  if (path && /^https?:\/\//.test(path)) return { url: path };
  if (path?.startsWith(ICON_PREFIX)) {
    const key = path.slice(ICON_PREFIX.length) as FoodIconKey;
    if (key in FOOD_ICONS) return { icon: key };
  }
  if (path) {
    const file = path.replace(/^.*\//, "").replace(/\.\w+$/, "").toLowerCase();
    const legacy = LEGACY_PHOTOS[decodeURIComponent(file)];
    if (legacy) return { icon: legacy };
  }
  return { icon: guessFoodIcon(name) };
}

export function FoodIcon({ icon, className = "h-6 w-6" }: { icon: FoodIconKey; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {FOOD_ICONS[icon].svg}
    </svg>
  );
}
