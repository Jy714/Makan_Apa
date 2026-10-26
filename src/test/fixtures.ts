import type { Place } from "../types/place";

export function makePlace(overrides: Partial<Place> & { id: string }): Place {
  return {
    name: overrides.id,
    category: "restaurant",
    latitude: 3.1466,
    longitude: 101.7113,
    distanceMeters: 100,
    categories: ["catering.restaurant"],
    ...overrides,
  };
}
