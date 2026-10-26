import { GEOAPIFY_PLACES_URL, PLACES_LIMIT, PLACES_TIMEOUT_MS } from "../config/mapConfig";
import type { GeoapifyResponse } from "../types/geoapify";
import type { AppError, Coordinates, Place } from "../types/place";
import { GEOAPIFY_CATEGORIES } from "../utils/categories";
import { sortPlacesByDistance, withinRadius } from "../utils/filtering";
import { deduplicatePlaces, normaliseGeoapifyFeatures } from "../utils/normalise";

export class PlacesError extends Error {
  constructor(public readonly appError: AppError) {
    super(appError.message);
  }
}

export type PlacesResult = {
  places: Place[];
  /** True when the provider returned the maximum number of results, i.e. there may be more further away. */
  truncated: boolean;
};

/**
 * Query strategy: a circle filter around the centre (lon,lat order) plus a proximity bias so the
 * nearest places come first when the limit is reached. Final radius filtering is still done
 * client-side with Haversine.
 */
export function buildPlacesUrl(centre: Coordinates, radiusMeters: number, apiKey: string): string {
  const lon = centre.longitude.toFixed(6);
  const lat = centre.latitude.toFixed(6);
  const params = new URLSearchParams({
    categories: GEOAPIFY_CATEGORIES.join(","),
    filter: `circle:${lon},${lat},${Math.round(radiusMeters)}`,
    bias: `proximity:${lon},${lat}`,
    limit: String(PLACES_LIMIT),
    lang: "en",
    apiKey,
  });
  return `${GEOAPIFY_PLACES_URL}?${params.toString()}`;
}

function errorForStatus(status: number): AppError {
  if (status === 401 || status === 403) {
    return {
      code: "api_key_invalid",
      message: "Your Geoapify API key was rejected. Check that it's correct and allowed for this website.",
    };
  }
  if (status === 429) {
    return {
      code: "api_rate_limited",
      message: "The daily free Geoapify quota for this API key has been used up, or requests are too frequent.",
    };
  }
  return { code: "api_http", message: "The place-search service returned an error." };
}

/** Single request, no automatic retries: the user retries explicitly. */
export async function fetchNearbyPlaces(
  centre: Coordinates,
  radiusMeters: number,
  apiKey: string,
  signal?: AbortSignal
): Promise<PlacesResult> {
  if (!apiKey.trim()) {
    throw new PlacesError({ code: "api_key_missing", message: "A Geoapify API key is needed to search." });
  }
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, PLACES_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    let res: Response;
    try {
      res = await fetch(buildPlacesUrl(centre, radiusMeters, apiKey.trim()), { signal: controller.signal });
    } catch (e) {
      if (signal?.aborted) throw e;
      throw new PlacesError(
        timedOut
          ? { code: "api_timeout", message: "The food search took too long to respond." }
          : { code: "api_network", message: "We couldn't reach the place-search service. Check your connection." }
      );
    }
    if (!res.ok) throw new PlacesError(errorForStatus(res.status));

    let json: unknown;
    try {
      json = await res.json();
    } catch (e) {
      if (signal?.aborted) throw e;
      throw new PlacesError({ code: "api_malformed", message: "We received an unexpected response from the search service." });
    }
    if (!json || typeof json !== "object" || !Array.isArray((json as GeoapifyResponse).features)) {
      throw new PlacesError({ code: "api_malformed", message: "We received an unexpected response from the search service." });
    }

    const features = (json as GeoapifyResponse).features;
    const places = deduplicatePlaces(normaliseGeoapifyFeatures(features, centre));
    return {
      places: sortPlacesByDistance(places.filter((p) => withinRadius(p, radiusMeters))),
      truncated: features.length >= PLACES_LIMIT,
    };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
