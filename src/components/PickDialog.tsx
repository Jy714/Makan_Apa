import { Clock, Dices, Footprints, Globe, Info, MapPinned, PartyPopper, Phone, X } from "lucide-react";
import { lazy, Suspense, useEffect, useRef } from "react";
import type { Coordinates, Place } from "../types/place";
import { CATEGORY_LABELS } from "../utils/categories";
import { formatDistance } from "../utils/distance";
import { PlaceLinks } from "./PlaceLinks";
import { PriceEstimate } from "./PriceEstimate";

const PlaceMiniMap = lazy(() => import("./FoodMap").then((m) => ({ default: m.PlaceMiniMap })));

type Props = {
  place: Place;
  apiKey: string;
  centre: Coordinates;
  centreLabel: string;
  estimate: number | undefined;
  onEstimateChange: (value: number | undefined) => void;
  onClose: () => void;
  onSpinAgain: () => void;
};

/** Modal "Today's Pick" result built on the native <dialog> (focus trap, Esc to close, top layer above the map). */
export function PickDialog({ place, apiKey, centre, centreLabel, estimate, onEstimateChange, onClose, onSpinAgain }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", ""); // Older browsers / jsdom.
    }
    // Always start at the top (name + map), with focus on the close button.
    closeRef.current?.focus({ preventScroll: true });
    if (dialog.firstElementChild) dialog.firstElementChild.scrollTop = 0;
    // No cleanup: calling close() here would fire `close` → onClose and immediately dismiss the dialog
    // under StrictMode's double-run. Unmounting removes the element from the top layer anyway.
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="pick-dialog-title"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself, outside the panel) closes it.
        if (e.target === ref.current) onClose();
      }}
      className="pick-dialog m-auto w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-3xl border border-line bg-surface p-0 text-ink shadow-2xl"
    >
      <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <div className="flex items-center justify-between gap-2 bg-tomato px-5 py-3 text-white">
          <p className="flex items-center gap-2 font-display text-lg font-bold">
            <PartyPopper className="h-5 w-5" aria-hidden="true" />
            Today's Pick
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-white/15 focus-visible:ring-white focus-visible:ring-offset-tomato"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="relative h-48 bg-cream sm:h-64">
          <Suspense fallback={<div className="h-full animate-pulse bg-line/50" />}>
            <PlaceMiniMap apiKey={apiKey} centre={centre} centreLabel={centreLabel} place={place} />
          </Suspense>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div>
            <h2 id="pick-dialog-title" className="break-words font-display text-2xl font-bold leading-tight sm:text-3xl">
              {place.name}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {CATEGORY_LABELS[place.category]}
              {place.cuisine && <> · {place.cuisine}</>}
            </p>
          </div>

          <ul className="space-y-2.5 text-sm">
            <li className="flex gap-2">
              <Footprints className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              <span>
                <strong>{formatDistance(place.distanceMeters)}</strong> from {centreLabel}{" "}
                <span className="text-muted">(approx. straight line)</span>
              </span>
            </li>
            <li className="flex gap-2">
              <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              <span className="break-words">{place.address ?? <span className="text-muted">Address not listed — see the map</span>}</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 w-4 shrink-0 text-center text-xs font-bold text-muted" aria-hidden="true">
                RM
              </span>
              <div className="space-y-1">
                <PriceEstimate estimate={estimate} onChange={onEstimateChange} />
                {estimate === undefined && (
                  <p className="flex items-start gap-1 text-xs text-muted">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Per-person prices aren't included in free map data, so we never guess them.
                  </p>
                )}
              </div>
            </li>
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
                <a href={place.website} target="_blank" rel="noopener noreferrer" className="break-all underline underline-offset-2">
                  {new URL(place.website).hostname.replace(/^www\./, "")}
                </a>
              </li>
            )}
          </ul>

          <PlaceLinks place={place} size="md" />

          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn-primary" onClick={onSpinAgain}>
              <Dices className="h-4 w-4" aria-hidden="true" />
              Spin again
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
