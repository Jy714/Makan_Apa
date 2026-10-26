import { Dices, Footprints, MapPinned, PartyPopper, Phone, Globe, Clock } from "lucide-react";
import type { Place } from "../types/place";
import { CATEGORY_LABELS } from "../utils/categories";
import { formatDistance } from "../utils/distance";
import { PlaceLinks } from "./PlaceLinks";
import { PriceEstimate } from "./PriceEstimate";

type Props = {
  place: Place;
  estimate: number | undefined;
  onEstimateChange: (value: number | undefined) => void;
  onSpinAgain: () => void;
  spinDisabled: boolean;
};

export function SelectedPlaceCard({ place, estimate, onEstimateChange, onSpinAgain, spinDisabled }: Props) {
  return (
    <section
      aria-labelledby="pick-heading"
      className="card overflow-hidden border-tomato/40"
    >
      <div className="flex items-center gap-2 bg-tomato px-5 py-3 text-white sm:px-6">
        <PartyPopper className="h-5 w-5" aria-hidden="true" />
        <h2 id="pick-heading" className="font-display text-lg font-bold">
          Today's Pick
        </h2>
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        <div>
          <p className="break-words font-display text-2xl font-bold leading-tight sm:text-3xl">{place.name}</p>
          <p className="mt-1 text-sm text-muted">
            {CATEGORY_LABELS[place.category]}
            {place.cuisine && <> · {place.cuisine}</>}
          </p>
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <Footprints className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            <span>
              {formatDistance(place.distanceMeters)} away{" "}
              <span className="text-muted">(approx. straight line)</span>
            </span>
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 w-4 shrink-0 text-center text-xs font-bold text-muted" aria-hidden="true">
              RM
            </span>
            <PriceEstimate estimate={estimate} onChange={onEstimateChange} />
          </li>
          {place.address && (
            <li className="flex gap-2">
              <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              <span className="break-words">{place.address}</span>
            </li>
          )}
          {place.openingHours && (
            <li className="flex gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              <span className="break-words">
                {place.openingHours} <span className="text-muted">(listed hours, may be outdated)</span>
              </span>
            </li>
          )}
          {place.phone && (
            <li className="flex gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              <a href={`tel:${place.phone.replace(/[^\d+]/g, "")}`} className="underline underline-offset-2">
                {place.phone}
              </a>
            </li>
          )}
          {place.website && (
            <li className="flex gap-2">
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all underline underline-offset-2"
              >
                {new URL(place.website).hostname.replace(/^www\./, "")}
              </a>
            </li>
          )}
        </ul>
        <PlaceLinks place={place} size="md" />
        <button type="button" onClick={onSpinAgain} disabled={spinDisabled} className="btn-secondary w-full">
          <Dices className="h-4 w-4" aria-hidden="true" />
          Spin again
        </button>
      </div>
    </section>
  );
}
