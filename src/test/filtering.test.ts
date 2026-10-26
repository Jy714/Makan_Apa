import type { Filters } from "../types/place";
import { priceMatchesBudget } from "../utils/budget";
import { filterPlaces, sortPlacesByDistance, withinRadius } from "../utils/filtering";
import { makePlace } from "./fixtures";

const base: Filters = { radiusMeters: 2000, category: "all", budget: "any", includeUnknownPrices: true };

const places = [
  makePlace({ id: "node/1", distanceMeters: 1500, category: "cafe" }),
  makePlace({ id: "node/2", distanceMeters: 300, category: "restaurant" }),
  makePlace({ id: "node/3", distanceMeters: 2000, category: "fast_food" }),
  makePlace({ id: "node/4", distanceMeters: 2000.5, category: "restaurant" }),
  makePlace({ id: "node/5", distanceMeters: 800, category: "bakery_dessert" }),
];

describe("radius filtering", () => {
  it("includes a place exactly on the boundary and excludes one just outside", () => {
    expect(withinRadius(places[2], 2000)).toBe(true);
    expect(withinRadius(places[3], 2000)).toBe(false);
  });

  it("excludes places outside the selected radius", () => {
    const ids = filterPlaces(places, { ...base, radiusMeters: 1000 }).map((p) => p.id);
    expect(ids).toEqual(["node/2", "node/5"]);
  });
});

describe("sorting", () => {
  it("sorts nearest first without mutating input", () => {
    const sorted = sortPlacesByDistance(places);
    expect(sorted.map((p) => p.distanceMeters)).toEqual([300, 800, 1500, 2000, 2000.5]);
    expect(places[0].id).toBe("node/1");
  });
});

describe("category filtering", () => {
  it("returns all categories for 'all'", () => {
    expect(filterPlaces(places, base)).toHaveLength(4);
  });
  it("keeps only the selected category", () => {
    const res = filterPlaces(places, { ...base, category: "restaurant" });
    expect(res.map((p) => p.id)).toEqual(["node/2"]);
  });
});

describe("budget filtering", () => {
  const overrides = { "node/1": 8, "node/2": 25 };

  it("'any' budget ignores price entirely", () => {
    expect(filterPlaces(places, { ...base, includeUnknownPrices: false })).toHaveLength(4);
  });

  it("strict budget excludes unknown-price places", () => {
    const res = filterPlaces(places, { ...base, budget: "under_10", includeUnknownPrices: false }, overrides);
    expect(res.map((p) => p.id)).toEqual(["node/1"]);
  });

  it("include-unknown keeps unknown-price places but still excludes known out-of-range ones", () => {
    const res = filterPlaces(places, { ...base, budget: "under_10", includeUnknownPrices: true }, overrides);
    expect(res.map((p) => p.id)).toEqual(["node/5", "node/1", "node/3"]);
  });

  it("returns nothing when no price data exists and unknowns are excluded", () => {
    expect(filterPlaces(places, { ...base, budget: "10_20", includeUnknownPrices: false })).toEqual([]);
  });

  it("uses inclusive lower / exclusive upper bounds", () => {
    expect(priceMatchesBudget(10, "10_20")).toBe(true);
    expect(priceMatchesBudget(20, "10_20")).toBe(false);
    expect(priceMatchesBudget(20, "20_35")).toBe(true);
    expect(priceMatchesBudget(9.99, "under_10")).toBe(true);
    expect(priceMatchesBudget(80, "over_50")).toBe(true);
  });
});

describe("empty input", () => {
  it("returns an empty list", () => {
    expect(filterPlaces([], base)).toEqual([]);
  });
});
