import { ArrowLeft, History, Info, KeyRound, List, LocateFixed, Map as MapIcon, RefreshCw } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiKeyPanel } from "../components/ApiKeyPanel";
import { FilterPanel } from "../components/FilterPanel";
import { Footer } from "../components/Footer";
import { FoodRoulette, type FoodRouletteHandle } from "../components/FoodRoulette";
import { Header } from "../components/Header";
import { LocationPanel } from "../components/LocationPanel";
import { PlaceCard } from "../components/PlaceCard";
import { PickDialog } from "../components/PickDialog";
import { SelectedPlaceCard } from "../components/SelectedPlaceCard";
import { EmptyState, ErrorState, LoadingState, PlaceSkeletons } from "../components/StatusStates";
import { DEFAULT_RADIUS_METERS, RADIUS_OPTIONS } from "../config/mapConfig";
import { useApiKey } from "../hooks/useApiKey";
import { useGeolocation } from "../hooks/useGeolocation";
import { useNearbyPlaces } from "../hooks/useNearbyPlaces";
import { clearCachedPlaces } from "../services/placesCache";
import type { Coordinates, Filters, Place } from "../types/place";
import { formatRadius } from "../utils/distance";
import { filterPlaces } from "../utils/filtering";

const FoodMap = lazy(() => import("../components/FoodMap").then((m) => ({ default: m.FoodMap })));

export const DEFAULT_FILTERS: Filters = {
  radiusMeters: DEFAULT_RADIUS_METERS,
  category: "all",
  budget: "any",
  includeUnknownPrices: true,
};

type Centre = { coords: Coordinates; label: string; isUserLocation: boolean };

export type NearbyNavState = { startLocation?: boolean } | null;

function formatAge(ts: number): string {
  const mins = Math.round((Date.now() - ts) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  return `${hours} h ago`;
}

export function NearbyFoodPage() {
  const routerLocation = useLocation();
  const navigate = useNavigate();
  const geo = useGeolocation();
  const keyStore = useApiKey();
  const nearby = useNearbyPlaces(keyStore.apiKey);
  const hasKey = Boolean(keyStore.apiKey);
  const [keyPanelOpen, setKeyPanelOpen] = useState(false);
  const rouletteRef = useRef<FoodRouletteHandle>(null);
  const wheelAnchorRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [centre, setCentre] = useState<Centre | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  // Session-only, in-memory price estimates the user typed. Never persisted.
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [announcement, setAnnouncement] = useState("");
  const [pickDialogOpen, setPickDialogOpen] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  const requestLocation = geo.request;

  // One-time intent from the landing CTA. Cleared immediately so refresh/back doesn't re-trigger it.
  // Without an API key, the intent waits until the visitor saves one (there'd be nothing to search with).
  const intentHandled = useRef(false);
  const pendingIntent = useRef(false);
  useEffect(() => {
    const state = routerLocation.state as NearbyNavState;
    if (!intentHandled.current && state?.startLocation) {
      intentHandled.current = true;
      if (hasKey) requestLocation();
      else pendingIntent.current = true;
      navigate(routerLocation.pathname, { replace: true, state: null });
    }
  }, [routerLocation, navigate, requestLocation, hasKey]);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Depend on the stable `search` function, never the hook's return object (a new object every render).
  const searchPlaces = nearby.search;
  const startSearch = useCallback(
    (next: Centre, opts: { bypassCache?: boolean; radius?: number } = {}) => {
      setCentre(next);
      setSelectedId(null);
      setCacheCleared(false);
      searchPlaces(next.coords, opts.radius ?? filtersRef.current.radiusMeters, { bypassCache: opts.bypassCache });
    },
    [searchPlaces]
  );

  // Fresh location fix → search, exactly once per fix. Saved results for the same area are reused
  // unless the user explicitly asked to refresh.
  const handledFix = useRef<typeof geo.state | null>(null);
  const refreshRequested = useRef(false);
  useEffect(() => {
    if (geo.state.status !== "success" || handledFix.current === geo.state) return;
    handledFix.current = geo.state;
    const bypassCache = refreshRequested.current;
    refreshRequested.current = false;
    startSearch({ coords: geo.state.coords, label: "your current location", isUserLocation: true }, { bypassCache });
  }, [geo.state, startSearch]);

  const allPlaces: Place[] = nearby.state.status === "success" ? nearby.state.places : [];
  const fetchedRadius = nearby.state.status === "success" ? nearby.state.fetchedRadiusMeters : 0;
  const effectiveRadius = Math.min(filters.radiusMeters, fetchedRadius || filters.radiusMeters);
  const needsWiderSearch = nearby.state.status === "success" && filters.radiusMeters > fetchedRadius;

  const eligible = useMemo(
    () => filterPlaces(allPlaces, { ...filters, radiusMeters: effectiveRadius }, priceOverrides),
    [allPlaces, filters, effectiveRadius, priceOverrides]
  );
  const selectedPlace = selectedId ? allPlaces.find((p) => p.id === selectedId) ?? null : null;
  const knownPriceCount = allPlaces.filter((p) => priceOverrides[p.id] !== undefined).length;

  useEffect(() => {
    if (nearby.state.status === "success") {
      const n = nearby.state.places.length;
      setAnnouncement(n ? `Found ${n} food place${n === 1 ? "" : "s"} nearby.` : "No food places found nearby.");
    }
  }, [nearby.state]);

  const setEstimate = (id: string, value: number | undefined) =>
    setPriceOverrides((prev) => {
      const next = { ...prev };
      if (value === undefined) delete next[id];
      else next[id] = value;
      return next;
    });

  const handleResult = (place: Place) => {
    setSelectedId(place.id);
    setAnnouncement(`Today's pick: ${place.name}.`);
    setPickDialogOpen(true);
  };

  /** Explicit refresh: fresh location fix (if using it) and a new request, ignoring saved results. */
  const searchAgain = () => {
    if (!centre) return;
    if (centre.isUserLocation) {
      refreshRequested.current = true;
      geo.request();
    } else startSearch(centre, { bypassCache: true });
  };

  const forgetSavedSearches = () => {
    clearCachedPlaces();
    setCacheCleared(true);
    setAnnouncement("Saved searches cleared from this browser.");
  };

  const cachedAt = nearby.state.status === "success" ? nearby.state.cachedAt : undefined;

  const changeLocation = () => {
    nearby.reset();
    geo.reset();
    setCentre(null);
    setSelectedId(null);
  };

  const spinFromCard = () => {
    wheelAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    rouletteRef.current?.spin();
  };

  const spinFromDialog = () => {
    setPickDialogOpen(false);
    spinFromCard();
  };

  const busy = nearby.state.status === "loading" || geo.state.status === "requesting";
  const keyRejected = nearby.state.status === "error" && nearby.state.error.code === "api_key_invalid";
  const showKeyPanel = !hasKey || keyPanelOpen;

  const saveKey = (key: string) => {
    keyStore.save(key);
    setKeyPanelOpen(false);
    if (pendingIntent.current) {
      pendingIntent.current = false;
      requestLocation();
    }
  };

  // After a new key is saved, re-run a search that failed because of the old key.
  const lastKey = useRef(keyStore.apiKey);
  useEffect(() => {
    if (lastKey.current === keyStore.apiKey) return;
    lastKey.current = keyStore.apiKey;
    if (centre && keyStore.apiKey && nearby.state.status === "error") startSearch(centre);
  }, [keyStore.apiKey, centre, nearby.state.status, startSearch]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header>
        {hasKey && (
          <button
            type="button"
            className="btn-ghost px-3"
            onClick={() => setKeyPanelOpen((o) => !o)}
            aria-expanded={keyPanelOpen}
          >
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">API key</span>
            <span className="sr-only sm:hidden">API key settings</span>
          </button>
        )}
        <Link to="/" className="btn-ghost px-3">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Home
        </Link>
      </Header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-8 sm:px-6">
        <div className="sr-only" aria-live="polite" role="status">
          {announcement}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Your Nearby Food Picks</h1>
            {centre && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                <LocateFixed className="h-4 w-4 shrink-0" aria-hidden="true" />
                Searching near {centre.label} · within {formatRadius(effectiveRadius || filters.radiusMeters)}
              </p>
            )}
            {centre && cachedAt !== undefined && nearby.state.status === "success" && (
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                <History className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {cacheCleared ? "Saved searches cleared." : `Saved results (fetched ${formatAge(cachedAt)}) — no credits used.`}
                </span>
                <button
                  type="button"
                  className="font-semibold text-tomato underline underline-offset-2 disabled:opacity-50"
                  onClick={searchAgain}
                  disabled={busy || spinning}
                >
                  Refresh
                </button>
                {!cacheCleared && (
                  <button type="button" className="underline underline-offset-2" onClick={forgetSavedSearches}>
                    Forget saved searches
                  </button>
                )}
              </p>
            )}
          </div>
          {centre && (
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={searchAgain} disabled={busy || spinning}>
                <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} aria-hidden="true" />
                Search again
              </button>
              <button type="button" className="btn-ghost" onClick={changeLocation} disabled={spinning}>
                Change location
              </button>
            </div>
          )}
        </div>

        <div className="mt-6">
          {showKeyPanel && (
            <div className="mb-6">
              <ApiKeyPanel
                source={keyStore.source}
                onSave={saveKey}
                onClear={keyStore.clear}
                onClose={() => setKeyPanelOpen(false)}
                problem={nearby.state.status === "error" && keyRejected ? nearby.state.error.message : undefined}
              />
            </div>
          )}

          {hasKey && !centre && geo.state.status !== "success" && (
            <LocationPanel
              requesting={geo.state.status === "requesting"}
              error={geo.state.status === "error" ? geo.state.error : null}
              onUseLocation={geo.request}
              onManualCentre={(coords, label) => {
                geo.reset();
                startSearch({ coords, label, isUserLocation: false });
              }}
            />
          )}

          {centre && nearby.state.status === "loading" && (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
              <LoadingState
                title="Looking for food nearby…"
                detail="Searching for restaurants, cafés, stalls and more. This usually takes a second or two."
              />
              <PlaceSkeletons count={4} />
            </div>
          )}

          {centre && geo.state.status === "requesting" && nearby.state.status !== "loading" && (
            <LoadingState title="Getting your location…" detail="Please allow location access if your browser asks." />
          )}

          {centre && geo.state.status === "error" && (
            <ErrorState
              title="We couldn't refresh your location"
              message={geo.state.error.message}
              actions={
                <>
                  <button className="btn-primary" onClick={geo.request}>Try again</button>
                  <button className="btn-secondary" onClick={changeLocation}>Choose another way</button>
                </>
              }
            />
          )}

          {centre && nearby.state.status === "error" && geo.state.status !== "requesting" && (
            <ErrorState
              title="Food search didn't finish"
              message={
                keyRejected || nearby.state.error.code === "api_rate_limited"
                  ? nearby.state.error.message
                  : `${nearby.state.error.message} Please try again in a moment.`
              }
              actions={
                <>
                  {keyRejected || nearby.state.error.code === "api_rate_limited" ? (
                    <button className="btn-primary" onClick={() => setKeyPanelOpen(true)}>
                      <KeyRound className="h-4 w-4" aria-hidden="true" />
                      Update API key
                    </button>
                  ) : (
                    <button className="btn-primary" onClick={() => startSearch(centre, { bypassCache: true })}>
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      Retry search
                    </button>
                  )}
                  <Link to="/" className="btn-secondary">Back to home</Link>
                </>
              }
            />
          )}

          {centre && nearby.state.status === "success" && geo.state.status !== "requesting" && geo.state.status !== "error" && (
            <>
              {allPlaces.length === 0 ? (
                <EmptyState
                  title="No food places found nearby"
                  actions={
                    <>
                      {fetchedRadius < RADIUS_OPTIONS[RADIUS_OPTIONS.length - 1] && (
                        <button
                          className="btn-primary"
                          onClick={() => {
                            const bigger = RADIUS_OPTIONS.find((r) => r > fetchedRadius) ?? fetchedRadius;
                            setFilters((f) => ({ ...f, radiusMeters: bigger }));
                            startSearch(centre, { radius: bigger });
                          }}
                        >
                          Search a bigger area
                        </button>
                      )}
                      <button className="btn-secondary" onClick={changeLocation}>Change location</button>
                    </>
                  }
                >
                  Map data coverage varies by area, and browser location can be approximate. Try a larger
                  radius or a different location.
                </EmptyState>
              ) : (
                <div className="space-y-6">
                  <FilterPanel
                    filters={filters}
                    onChange={setFilters}
                    onClear={() => setFilters((f) => ({ ...DEFAULT_FILTERS, radiusMeters: f.radiusMeters }))}
                    disabled={spinning}
                    needsWiderSearch={needsWiderSearch}
                    onWiderSearch={() => startSearch(centre)}
                  />

                  {filters.budget !== "any" && knownPriceCount === 0 && (
                    <p className="flex items-start gap-2 rounded-2xl border border-line bg-surface p-4 text-sm">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-tomato" aria-hidden="true" />
                      <span>
                        The public data source doesn't include enough pricing information to filter accurately by
                        budget. {filters.includeUnknownPrices
                          ? "Places with unknown prices are still shown. Add your own estimate on any place to use it in this filter."
                          : "Turn on “Include places with unknown prices”, or add your own estimates, to see results."}
                      </span>
                    </p>
                  )}

                  <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
                    <div className="space-y-6 lg:sticky lg:top-20" ref={wheelAnchorRef}>
                      <FoodRoulette
                        ref={rouletteRef}
                        eligible={eligible}
                        onResult={handleResult}
                        onSpinningChange={setSpinning}
                      />
                      {selectedPlace && (
                        <SelectedPlaceCard
                          place={selectedPlace}
                          estimate={priceOverrides[selectedPlace.id]}
                          onEstimateChange={(v) => setEstimate(selectedPlace.id, v)}
                          onSpinAgain={spinFromCard}
                          spinDisabled={spinning || eligible.length === 0}
                        />
                      )}
                    </div>

                    <div className="min-w-0 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lg font-bold">
                          {eligible.length} eligible place{eligible.length === 1 ? "" : "s"}
                          <span className="ml-2 text-sm font-normal text-muted">
                            of {allPlaces.length} found · nearest first
                            {nearby.state.status === "success" && nearby.state.truncated && " · showing the nearest results only"}
                          </span>
                        </h2>
                        <div className="inline-flex rounded-full border border-line bg-surface p-1 lg:hidden" role="group" aria-label="Results view">
                          {(["list", "map"] as const).map((v) => (
                            <button
                              key={v}
                              type="button"
                              aria-pressed={mobileView === v}
                              onClick={() => setMobileView(v)}
                              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-4 text-sm font-semibold ${
                                mobileView === v ? "bg-ink text-white" : "text-ink"
                              }`}
                            >
                              {v === "list" ? <List className="h-4 w-4" aria-hidden="true" /> : <MapIcon className="h-4 w-4" aria-hidden="true" />}
                              {v === "list" ? "List" : "Map"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className={`h-[360px] lg:block lg:h-[340px] ${mobileView === "map" ? "block" : "hidden"}`}>
                        <Suspense fallback={<div className="h-full animate-pulse rounded-3xl bg-line/50" />}>
                          <FoodMap
                            apiKey={keyStore.apiKey}
                            centre={centre.coords}
                            centreLabel={centre.label}
                            radiusMeters={effectiveRadius}
                            places={eligible}
                            selectedId={selectedId}
                          />
                        </Suspense>
                      </div>

                      <div className={`${mobileView === "list" ? "block" : "hidden"} lg:block`}>
                        {eligible.length === 0 ? (
                          <EmptyState
                            title="No places match your filters"
                            actions={
                              <>
                                {filters.budget !== "any" && !filters.includeUnknownPrices && (
                                  <button
                                    className="btn-primary"
                                    onClick={() => setFilters((f) => ({ ...f, includeUnknownPrices: true }))}
                                  >
                                    Include unknown prices
                                  </button>
                                )}
                                <button
                                  className="btn-secondary"
                                  onClick={() => setFilters((f) => ({ ...DEFAULT_FILTERS, radiusMeters: f.radiusMeters }))}
                                >
                                  Clear filters
                                </button>
                              </>
                            }
                          >
                            {filters.budget !== "any" && !filters.includeUnknownPrices
                              ? "Most places don't have price information, so a strict budget filter hides them."
                              : "Try a different food type or a larger distance."}
                          </EmptyState>
                        ) : (
                          <ul className="space-y-3">
                            {eligible.map((p) => (
                              <li key={p.id}>
                                <PlaceCard
                                  place={p}
                                  isSelected={p.id === selectedId}
                                  estimate={priceOverrides[p.id]}
                                  onEstimateChange={(v) => setEstimate(p.id, v)}
                                  onPick={() => handleResult(p)}
                                  pickDisabled={spinning}
                                />
                              </li>
                            ))}
                          </ul>
                        )}
                        <p className="mt-4 text-xs text-muted">
                          Distances are approximate straight-line distances from the search centre, not walking or
                          driving routes. Results come from community map data (OpenStreetMap via Geoapify) and may be incomplete.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {pickDialogOpen && selectedPlace && centre && (
          <PickDialog
            key={selectedPlace.id}
            place={selectedPlace}
            apiKey={keyStore.apiKey}
            centre={centre.coords}
            centreLabel={centre.label}
            estimate={priceOverrides[selectedPlace.id]}
            onEstimateChange={(v) => setEstimate(selectedPlace.id, v)}
            onClose={() => setPickDialogOpen(false)}
            onSpinAgain={spinFromDialog}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
