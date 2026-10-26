import { useCallback, useRef, useState } from "react";
import type { AppError, LocationState } from "../types/place";

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 15_000,
  maximumAge: 60_000,
};

export function geolocationErrorToAppError(code: number | "unsupported"): AppError {
  switch (code) {
    case "unsupported":
      return {
        code: "geolocation_unsupported",
        message: "Your browser doesn't support location access.",
      };
    case 1:
      return {
        code: "permission_denied",
        message:
          "Location access was blocked. To allow it, tap the lock or site-settings icon next to the address bar, set Location to “Allow”, then try again.",
      };
    case 3:
      return {
        code: "location_timeout",
        message: "Getting your location took too long. Check that location services are on and try again.",
      };
    default:
      return {
        code: "position_unavailable",
        message: "We couldn't determine your location right now. Try again in a moment.",
      };
  }
}

/** One-shot location lookup. Coordinates live only in React state and are never persisted. */
export function useGeolocation() {
  const [state, setState] = useState<LocationState>({ status: "idle" });
  const inFlight = useRef(false);

  const request = useCallback(() => {
    if (inFlight.current) return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState({ status: "error", error: geolocationErrorToAppError("unsupported") });
      return;
    }
    inFlight.current = true;
    setState({ status: "requesting" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        inFlight.current = false;
        setState({
          status: "success",
          coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
        });
      },
      (err) => {
        inFlight.current = false;
        setState({ status: "error", error: geolocationErrorToAppError(err.code) });
      },
      GEO_OPTIONS
    );
  }, []);

  const reset = useCallback(() => setState({ status: "idle" }), []);

  return { state, request, reset };
}
