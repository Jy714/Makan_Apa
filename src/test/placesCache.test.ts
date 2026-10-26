import {
  CACHE_MAX_ENTRIES,
  CACHE_TTL_MS,
  clearCachedPlaces,
  getCachedPlaces,
  saveCachedPlaces,
} from "../services/placesCache";
import { makePlace } from "./fixtures";

const centre = { latitude: 3.1466, longitude: 101.7113 };
const near = makePlace({ id: "near", latitude: 3.1476, longitude: 101.7113 }); // ~110 m north
const mid = makePlace({ id: "mid", latitude: 3.1556, longitude: 101.7113 }); // ~1 km north
const T0 = 1_700_000_000_000;

beforeEach(() => localStorage.clear());

describe("places cache", () => {
  it("returns saved places for the same area and radius", () => {
    saveCachedPlaces(centre, 2000, { places: [near, mid], truncated: false }, T0);
    const hit = getCachedPlaces(centre, 2000, T0 + 1000);
    expect(hit?.places.map((p) => p.id)).toEqual(["near", "mid"]);
    expect(hit?.savedAt).toBe(T0);
  });

  it("only stores a rounded (~110 m) centre, never the precise fix", () => {
    saveCachedPlaces({ latitude: 3.146612345, longitude: 101.711398765 }, 2000, { places: [], truncated: false }, T0);
    const raw = localStorage.getItem("makan-apa:places-cache:v1")!;
    expect(raw).toContain('"lat":3.147');
    expect(raw).toContain('"lon":101.711');
    expect(raw).not.toContain("3.1466");
  });

  it("reuses results for a nearby centre and recomputes distances from it", () => {
    saveCachedPlaces(centre, 2000, { places: [near, mid], truncated: false }, T0);
    const moved = { latitude: 3.1476, longitude: 101.7113 }; // ~110 m away, standing on "near"
    const hit = getCachedPlaces(moved, 2000, T0);
    expect(hit).not.toBeNull();
    expect(hit!.places[0].id).toBe("near");
    expect(hit!.places[0].distanceMeters).toBeLessThan(5);
  });

  it("misses when the centre is too far away", () => {
    saveCachedPlaces(centre, 2000, { places: [near], truncated: false }, T0);
    expect(getCachedPlaces({ latitude: 3.1566, longitude: 101.7113 }, 2000, T0)).toBeNull(); // ~1.1 km
  });

  it("serves a smaller radius from a complete larger search, filtering locally", () => {
    saveCachedPlaces(centre, 2000, { places: [near, mid], truncated: false }, T0);
    expect(getCachedPlaces(centre, 500, T0)?.places.map((p) => p.id)).toEqual(["near"]);
  });

  it("does not serve a smaller radius from a truncated larger search, or a larger radius at all", () => {
    saveCachedPlaces(centre, 2000, { places: [near, mid], truncated: true }, T0);
    expect(getCachedPlaces(centre, 500, T0)).toBeNull();
    expect(getCachedPlaces(centre, 5000, T0)).toBeNull();
  });

  it("expires entries after the TTL", () => {
    saveCachedPlaces(centre, 2000, { places: [near], truncated: false }, T0);
    expect(getCachedPlaces(centre, 2000, T0 + CACHE_TTL_MS + 1)).toBeNull();
  });

  it("replaces the entry for the same area and caps the number of entries", () => {
    saveCachedPlaces(centre, 2000, { places: [near], truncated: false }, T0);
    saveCachedPlaces(centre, 2000, { places: [mid], truncated: false }, T0 + 1);
    expect(getCachedPlaces(centre, 2000, T0 + 2)?.places.map((p) => p.id)).toEqual(["mid"]);

    for (let i = 0; i < CACHE_MAX_ENTRIES + 3; i++) {
      saveCachedPlaces({ latitude: 3 + i * 0.1, longitude: 101 }, 1000, { places: [], truncated: false }, T0 + 10 + i);
    }
    expect(JSON.parse(localStorage.getItem("makan-apa:places-cache:v1")!)).toHaveLength(CACHE_MAX_ENTRIES);
  });

  it("survives corrupted storage and can be cleared", () => {
    localStorage.setItem("makan-apa:places-cache:v1", "{not json");
    expect(getCachedPlaces(centre, 2000, T0)).toBeNull();
    saveCachedPlaces(centre, 2000, { places: [near], truncated: false }, T0);
    clearCachedPlaces();
    expect(getCachedPlaces(centre, 2000, T0)).toBeNull();
  });
});
