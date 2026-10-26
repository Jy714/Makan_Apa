import { Clock, Footprints, Utensils } from "lucide-react";
import type { Place } from "../types/place";
import { CATEGORY_LABELS } from "../utils/categories";
import { formatDistance } from "../utils/distance";
import { PlaceLinks } from "./PlaceLinks";
import { PriceEstimate } from "./PriceEstimate";

type Props = {
  place: Place;
  isSelected: boolean;
  estimate: number | undefined;
  onEstimateChange: (value: number | undefined) => void;
  onPick: () => void;
  pickDisabled: boolean;
};

export function PlaceCard({ place, isSelected, estimate, onEstimateChange, onPick, pickDisabled }: Props) {
  return (
    <article
      className={`rounded-2xl border bg-surface p-4 transition-colors ${
        isSelected ? "border-tomato ring-2 ring-tomato/20" : "border-line"
      }`}
      aria-current={isSelected ? "true" : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-base font-bold leading-snug">{place.name}</h3>
          <p className="mt-0.5 text-sm text-muted">
            {CATEGORY_LABELS[place.category]}
            {place.cuisine && <> · {place.cuisine}</>}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-xs font-semibold">
          <Footprints className="h-3.5 w-3.5" aria-hidden="true" />
          {formatDistance(place.distanceMeters)}
          <span className="sr-only">straight-line distance</span>
        </span>
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex gap-2">
          <dt className="sr-only">Price</dt>
          <Utensils className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
          <dd>
            <PriceEstimate estimate={estimate} onChange={onEstimateChange} />
          </dd>
        </div>
        {place.openingHours && (
          <div className="flex gap-2">
            <dt className="sr-only">Opening hours (from map data)</dt>
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <dd className="break-words text-muted">
              <span className="text-ink">{place.openingHours}</span>{" "}
              <span className="text-xs">(listed hours, may be outdated)</span>
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <PlaceLinks place={place} />
        <button
          type="button"
          onClick={onPick}
          disabled={pickDisabled}
          className="btn-ghost px-3 py-2 text-xs text-tomato"
        >
          {isSelected ? "Today's pick ✓" : "Pick this one"}
        </button>
      </div>
    </article>
  );
}
