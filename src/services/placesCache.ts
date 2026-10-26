import type { Coordinates, Place } from "../types/place";
import { calculateDistanceMeters } from "../utils/distance";
import { sortPlacesByDistance, withinRadius } from "../utils/filtering";

/**
 * Browser-side cache of place searches, so repeating a search in the same area costs no credits.
 *
 * - Only the fetch depends on location + radius; category/budget filters are applied locally,
 *   so they never need a new request.
 * - The search centre is stored rounded to 3 decimals (~110 m), never the precise fix.
 * - Entries expire after CACHE_TTL_MS, at most CACHE_MAX_ENTRIES are kept, and the user can clear them.
 */
const STORAGE_KEY = "makan-apa:places-cache:v1";
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const CACHE_MAX_ENTRIES = 8;
/** A new search reuses a saved one when its centre is within this distance. */
export const CACHE_MATCH_METERS = 150;

type CacheEntry = {
  lat: number;
  lon: number;
  radius: number;
  savedAt: number;
  truncated: boolean;
  places: Place[];
};

export type CachedResult = { places: Place[]; truncated: boolean; savedAt: number };

const round3 = (n: number) => Math.round(n * 1000) / 1000;

function read(): CacheEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CacheEntry[]).filter((e) => e && Array.isArray(e.places)) : [];
  } catch {
    return [];
  }
}

function write(entries: CacheEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota exceeded or storage blocked: drop the oldest half and try once more, else give up quietly.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(Math.ceil(entries.length / 2))));
    } catch {
      /* caching is best-effort */
    }
  }
}

const fresh = (e: CacheEntry, now: number) => now - e.savedAt < CACHE_TTL_MS;

/**
 * Returns saved places for this area, with distances recomputed from the new centre.
 * An entry for a larger radius is reused when it wasn't truncated (so it contains every place).
 */
export function getCachedPlaces(centre: Coordinates, radiusMeters: number, now = Date.now()): CachedResult | null {
  const candidates = read()
    .filter((e) => fresh(e, now))
    .map((e) => ({ e, offset: calculateDistanceMeters(centre.latitude, centre.longitude, e.lat, e.lon) }))
    .filter(({ e, offset }) => offset <= CACHE_MATCH_METERS && (e.radius === radiusMeters || (e.radius > radiusMeters && !e.truncated)))
    // Prefer an exact radius match, then the closest centre, then the newest.
    .sort((a, b) => Number(b.e.radius === radiusMeters) - Number(a.e.radius === radiusMeters) || a.offset - b.offset || b.e.savedAt - a.e.savedAt);

  const hit = candidates[0]?.e;
  if (!hit) return null;
  const places = hit.places
    .map((p) => ({ ...p, distanceMeters: calculateDistanceMeters(centre.latitude, centre.longitude, p.latitude, p.longitude) }))
    .filter((p) => withinRadius(p, radiusMeters));
  return {
    places: sortPlacesByDistance(places),
    truncated: hit.radius === radiusMeters ? hit.truncated : false,
    savedAt: hit.savedAt,
  };
}

export function saveCachedPlaces(
  centre: Coordinates,
  radiusMeters: number,
  result: { places: Place[]; truncated: boolean },
  now = Date.now()
): void {
  const lat = round3(centre.latitude);
  const lon = round3(centre.longitude);
  const kept = read().filter(
    (e) =>
      fresh(e, now) &&
      // Replace an older entry for the same area and radius.
      !(e.radius === radiusMeters && calculateDistanceMeters(lat, lon, e.lat, e.lon) <= CACHE_MATCH_METERS)
  );
  kept.push({ lat, lon, radius: radiusMeters, savedAt: now, truncated: result.truncated, places: result.places });
  write(kept.slice(-CACHE_MAX_ENTRIES));
}

export function clearCachedPlaces(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
