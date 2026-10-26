import { LocateFixed, ShieldCheck } from "lucide-react";
import { useId, useState } from "react";
import { CITY_CENTRES } from "../config/cityCentres";
import type { AppError, Coordinates } from "../types/place";

type Props = {
  requesting: boolean;
  error: AppError | null;
  onUseLocation: () => void;
  onManualCentre: (coords: Coordinates, label: string) => void;
};

export function LocationPanel({ requesting, error, onUseLocation, onManualCentre }: Props) {
  const [cityId, setCityId] = useState(CITY_CENTRES[0].id);
  const selectId = useId();

  return (
    <section className="card mx-auto max-w-2xl p-6 text-center sm:p-10" aria-labelledby="loc-heading">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-tomato-soft text-tomato">
        <LocateFixed className="h-7 w-7" aria-hidden="true" />
      </div>
      <h2 id="loc-heading" className="mt-4 font-display text-2xl font-bold sm:text-3xl">
        {error ? "We couldn't get your location" : "Let's find food around you"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-muted" role={error ? "alert" : undefined}>
        {error
          ? error.message
          : "Makan Apa needs your location once to search for food places nearby. You'll see a browser prompt asking for permission."}
      </p>

      <button
        type="button"
        onClick={onUseLocation}
        disabled={requesting}
        className="btn-primary mt-6 w-full text-base sm:w-auto sm:px-8"
      >
        <LocateFixed className="h-5 w-5" aria-hidden="true" />
        {requesting ? "Getting your location…" : error ? "Try again" : "Use my location"}
      </button>

      <p className="mx-auto mt-4 flex max-w-md items-start justify-center gap-2 text-xs text-muted">
        <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
        Your precise location isn't saved by this website. It's only sent to the Geoapify place-search service
        to find nearby places. To save credits, recent results (with a rough ~100 m area) are kept in this browser
        for 24 hours.
      </p>

      <div className="mt-8 border-t border-line pt-6 text-left">
        <p className="text-sm font-semibold">Or explore a city centre instead</p>
        <p className="text-xs text-muted">Handy if location is blocked or you're planning ahead.</p>
        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            const city = CITY_CENTRES.find((c) => c.id === cityId);
            if (city) onManualCentre(city.coords, city.label);
          }}
        >
          <label htmlFor={selectId} className="sr-only">
            City centre
          </label>
          <select id={selectId} className="select" value={cityId} onChange={(e) => setCityId(e.target.value)}>
            {CITY_CENTRES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-secondary shrink-0" disabled={requesting}>
            Search here
          </button>
        </form>
      </div>
    </section>
  );
}
