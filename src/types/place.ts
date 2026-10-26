export type FoodCategory =
  | "restaurant"
  | "fast_food"
  | "cafe"
  | "bakery_dessert"
  | "food_court_stall"
  | "other";

export type Place = {
  /** Geoapify place_id. */
  id: string;
  name: string;
  category: FoodCategory;
  latitude: number;
  longitude: number;
  address?: string;
  cuisine?: string;
  /** Only set when a user explicitly enters an estimate. Never inferred. */
  estimatedPriceRm?: number;
  openingHours?: string;
  website?: string;
  phone?: string;
  distanceMeters: number;
  /** Raw Geoapify category keys, e.g. "catering.restaurant.malaysian". */
  categories: string[];
};

export type Coordinates = { latitude: number; longitude: number };

export type BudgetFilter =
  | "any"
  | "under_10"
  | "10_20"
  | "20_35"
  | "35_50"
  | "over_50";

export type CategoryFilter = FoodCategory | "all";

export type Filters = {
  radiusMeters: number;
  category: CategoryFilter;
  budget: BudgetFilter;
  includeUnknownPrices: boolean;
};

export type AppErrorCode =
  | "permission_denied"
  | "position_unavailable"
  | "location_timeout"
  | "geolocation_unsupported"
  | "api_key_missing"
  | "api_key_invalid"
  | "api_rate_limited"
  | "too_many_searches"
  | "api_timeout"
  | "api_http"
  | "api_network"
  | "api_malformed";

export type AppError = {
  code: AppErrorCode;
  message: string;
};

export type LocationState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "success"; coords: Coordinates }
  | { status: "error"; error: AppError };

export type PlacesState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "success";
      places: Place[];
      truncated: boolean;
      fetchedRadiusMeters: number;
      /** Set when the results came from the browser cache: when they were originally fetched. */
      cachedAt?: number;
    }
  | { status: "error"; error: AppError };
