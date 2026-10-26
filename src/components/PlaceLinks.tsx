import { MapPin, Navigation } from "lucide-react";
import type { Place } from "../types/place";
import { buildDirectionsLink, buildOsmLink } from "../utils/mapLinks";

export function PlaceLinks({ place, size = "sm" }: { place: Place; size?: "sm" | "md" }) {
  const osm = buildOsmLink(place.latitude, place.longitude);
  const directions = buildDirectionsLink(place.latitude, place.longitude);
  if (!osm && !directions) return null;
  const cls = size === "sm" ? "btn-secondary px-3.5 py-2 text-xs" : "btn-secondary";
  return (
    <div className="flex flex-wrap gap-2">
      {osm && (
        <a href={osm} target="_blank" rel="noopener noreferrer" className={cls}>
          <MapPin className="h-4 w-4" aria-hidden="true" />
          Open in OpenStreetMap
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
      {directions && (
        <a href={directions} target="_blank" rel="noopener noreferrer" className={cls}>
          <Navigation className="h-4 w-4" aria-hidden="true" />
          Get directions
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
    </div>
  );
}
