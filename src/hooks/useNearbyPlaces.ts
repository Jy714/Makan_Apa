import { useCallback, useEffect, useRef, useState } from "react";
import { fetchNearbyPlaces, PlacesError } from "../services/geoapifyService";
import { getCachedPlaces, saveCachedPlaces } from "../services/placesCache";
import type { Coordinates, PlacesState } from "../types/place";

/**
 * Circuit breaker: no matter what the UI does (bugs included), never send more than
 * MAX_REQUESTS_PER_WINDOW paid requests per window. Protects the user's free credits.
 */
export const MAX_REQUESTS_PER_WINDOW = 6;
export const REQUEST_WINDOW_MS = 60_000;
const recentRequests: number[] = [];

export function allowRequest(now = Date.now()): boolean {
  while (recentRequests.length && now - recentRequests[0] > REQUEST_WINDOW_MS) recentRequests.shift();
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) return false;
  recentRequests.push(now);
  return true;
}

/** Test helper. */
export function resetRequestBudget() {
  recentRequests.length = 0;
}

export function useNearbyPlaces(apiKey: string) {
  const [state, setState] = useState<PlacesState>({ status: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const search = useCallback(
    async (centre: Coordinates, radiusMeters: number, opts: { bypassCache?: boolean } = {}) => {
      // Same area + radius as a recent search → reuse it from browser storage (no request, no credits).
      const cached = opts.bypassCache ? null : getCachedPlaces(centre, radiusMeters);
      if (cached) {
        controllerRef.current?.abort();
        setState({
          status: "success",
          places: cached.places,
          truncated: cached.truncated,
          fetchedRadiusMeters: radiusMeters,
          cachedAt: cached.savedAt,
        });
        return;
      }
      if (!allowRequest()) {
        setState({
          status: "error",
          error: {
            code: "too_many_searches",
            message: "That's a lot of searches in a short time. Please wait a minute before searching again.",
          },
        });
        return;
      }
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setState({ status: "loading" });
      try {
        const result = await fetchNearbyPlaces(centre, radiusMeters, apiKey, controller.signal);
        if (controller.signal.aborted) return;
        saveCachedPlaces(centre, radiusMeters, result);
        setState({ status: "success", ...result, fetchedRadiusMeters: radiusMeters });
      } catch (e) {
        if (controller.signal.aborted) return;
        if (import.meta.env.DEV && import.meta.env.MODE !== "test") console.warn("[places]", e);
        setState({
          status: "error",
          error:
            e instanceof PlacesError
              ? e.appError
              : { code: "api_network", message: "Something went wrong while searching for food." },
        });
      }
    },
    [apiKey]
  );

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setState({ status: "idle" });
  }, []);

  return { state, search, reset };
}
