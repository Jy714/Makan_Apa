import type { CategoryFilter, FoodCategory } from "../types/place";

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  restaurant: "Restaurant",
  fast_food: "Fast food",
  cafe: "Café",
  bakery_dessert: "Bakery & desserts",
  food_court_stall: "Food court & stall",
  other: "Other food place",
};

export const CATEGORY_FILTER_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All food" },
  { value: "restaurant", label: "Restaurants" },
  { value: "fast_food", label: "Fast food" },
  { value: "cafe", label: "Cafés" },
  { value: "bakery_dessert", label: "Bakeries & desserts" },
  { value: "food_court_stall", label: "Food courts & stalls" },
  { value: "other", label: "Other food places" },
];

/**
 * Geoapify category keys we query (parents include their sub-categories).
 * Drink-led venues (catering.bar, catering.pub, catering.biergarten, catering.taproom) are deliberately excluded.
 */
export const GEOAPIFY_CATEGORIES = [
  "catering.restaurant",
  "catering.fast_food",
  "catering.cafe",
  "catering.food_court",
  "catering.ice_cream",
  "commercial.food_and_drink.bakery",
  "commercial.food_and_drink.confectionery",
] as const;

const DESSERT_CAFE = new Set([
  "catering.cafe.dessert",
  "catering.cafe.cake",
  "catering.cafe.donut",
  "catering.cafe.ice_cream",
  "catering.cafe.frozen_yogurt",
  "catering.cafe.waffle",
  "catering.cafe.crepe",
]);

const has = (cats: string[], prefix: string) => cats.some((c) => c === prefix || c.startsWith(`${prefix}.`));

export function categoryFromGeoapify(cats: string[]): FoodCategory {
  if (has(cats, "catering.food_court")) return "food_court_stall";
  if (has(cats, "catering.restaurant")) return "restaurant";
  if (has(cats, "catering.fast_food")) return "fast_food";
  if (
    has(cats, "catering.ice_cream") ||
    has(cats, "commercial.food_and_drink.bakery") ||
    has(cats, "commercial.food_and_drink.confectionery") ||
    cats.some((c) => DESSERT_CAFE.has(c))
  ) {
    return "bakery_dessert";
  }
  if (has(cats, "catering.cafe")) return "cafe";
  return "other";
}

/** Cuisine from the provider's own category key, e.g. "catering.restaurant.malaysian" → "malaysian". */
export function cuisineFromCategories(cats: string[]): string | undefined {
  const found = cats
    .filter((c) => /^catering\.(restaurant|fast_food)\.[a-z_-]+$/.test(c))
    .map((c) => c.split(".")[2]);
  return found.length ? found.join(";") : undefined;
}
