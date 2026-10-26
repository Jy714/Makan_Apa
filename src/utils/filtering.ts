import type { Filters, Place } from "../types/place";
import { priceMatchesBudget } from "./budget";

export function sortPlacesByDistance(places: Place[]): Place[] {
  return places.slice().sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/** Boundary is inclusive: a place exactly at the radius is eligible. */
export function withinRadius(place: Place, radiusMeters: number): boolean {
  return place.distanceMeters <= radiusMeters;
}

/**
 * Single source of truth for the eligible pool: the list, map markers, count and wheel all use this.
 * `priceOverrides` holds user-entered session estimates keyed by place id.
 */
export function filterPlaces(
  places: Place[],
  filters: Filters,
  priceOverrides: Record<string, number> = {}
): Place[] {
  return sortPlacesByDistance(
    places.filter((p) => {
      if (!withinRadius(p, filters.radiusMeters)) return false;
      if (filters.category !== "all" && p.category !== filters.category) return false;
      if (filters.budget !== "any") {
        const price = priceOverrides[p.id] ?? p.estimatedPriceRm;
        if (price === undefined) return filters.includeUnknownPrices;
        return priceMatchesBudget(price, filters.budget);
      }
      return true;
    })
  );
}
