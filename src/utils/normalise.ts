import type { GeoapifyFeature, GeoapifyProperties } from "../types/geoapify";
import type { Coordinates, Place } from "../types/place";
import { categoryFromGeoapify, cuisineFromCategories } from "./categories";
import { calculateDistanceMeters } from "./distance";
import { isValidCoordinate } from "./mapLinks";

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);

function buildAddress(p: GeoapifyProperties, name: string): string | undefined {
  const street = [p.housenumber, p.street].filter(Boolean).join(" ");
  const parts = [street, p.suburb, p.city, p.postcode].filter((x): x is string => Boolean(x && x.trim()));
  if (parts.length) return parts.join(", ");
  // `formatted` usually starts with the place name; strip it so we don't repeat ourselves.
  const formatted = str(p.formatted);
  if (!formatted) return undefined;
  const withoutName = formatted.startsWith(`${name}, `) ? formatted.slice(name.length + 2) : formatted;
  return withoutName !== name ? withoutName : undefined;
}

function prettyCuisine(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const items = raw
    .split(";")
    .map((c) => c.trim().replace(/_/g, " "))
    .filter(Boolean)
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1));
  return items.length ? [...new Set(items)].join(", ") : undefined;
}

/** Only http(s) URLs are allowed through, so provider values can never inject `javascript:` links. */
export function safeUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().split(";")[0];
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(candidate);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Converts Geoapify features to Place records. Unnamed or unlocatable features are skipped. */
export function normaliseGeoapifyFeatures(features: GeoapifyFeature[], centre: Coordinates): Place[] {
  const places: Place[] = [];
  for (const f of features) {
    const p = f?.properties;
    if (!p) continue;
    const raw = p.datasource?.raw ?? {};
    const name = str(p.name) ?? str(raw["name:en"]) ?? str(raw["name:ms"]);
    if (!name) continue;

    const lat = p.lat ?? f.geometry?.coordinates?.[1];
    const lon = p.lon ?? f.geometry?.coordinates?.[0];
    if (lat === undefined || lon === undefined || !isValidCoordinate(lat, lon)) continue;

    const categories = Array.isArray(p.categories) ? p.categories.filter((c) => typeof c === "string") : [];
    const id = str(p.place_id) ?? `${lat.toFixed(6)},${lon.toFixed(6)},${name}`;

    places.push({
      id,
      name,
      category: categoryFromGeoapify(categories),
      latitude: lat,
      longitude: lon,
      address: buildAddress(p, name),
      cuisine: prettyCuisine(str(p.catering?.cuisine) ?? str(raw.cuisine) ?? cuisineFromCategories(categories)),
      openingHours: str(p.opening_hours) ?? str(raw.opening_hours),
      website: safeUrl(str(p.website) ?? str(raw.website) ?? str(raw["contact:website"])),
      phone: str(p.contact?.phone) ?? str(raw.phone) ?? str(raw["contact:phone"]),
      distanceMeters: calculateDistanceMeters(centre.latitude, centre.longitude, lat, lon),
      categories,
    });
  }
  return places;
}

export function deduplicatePlaces(places: Place[]): Place[] {
  const seen = new Set<string>();
  return places.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}
