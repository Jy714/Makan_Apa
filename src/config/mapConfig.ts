/**
 * All external endpoints live here. Geoapify's free plan (3,000 credits/day, no card needed)
 * covers both place search and map tiles. Each user/deployer brings their own API key.
 *  - Places API: https://apidocs.geoapify.com/docs/places/
 *  - Map tiles:  https://apidocs.geoapify.com/docs/maps/map-tiles/
 */
export const GEOAPIFY_PLACES_URL = "https://api.geoapify.com/v2/places";
export const GEOAPIFY_SIGNUP_URL = "https://myprojects.geoapify.com/";

/** Places cost 1 credit per 20 results, so 200 results = at most 10 credits per search. */
export const PLACES_LIMIT = 200;
export const PLACES_TIMEOUT_MS = 20_000;

export const tileUrl = (apiKey: string) =>
  `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${encodeURIComponent(apiKey)}`;
export const TILE_ATTRIBUTION =
  'Powered by <a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer">Geoapify</a> | &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

export const GEOAPIFY_URL = "https://www.geoapify.com/";
export const AUTHOR_GITHUB_URL = "https://github.com/Jy714";
export const OSM_COPYRIGHT_URL = "https://www.openstreetmap.org/copyright";

export const RADIUS_OPTIONS = [500, 1000, 2000, 5000] as const;
export const DEFAULT_RADIUS_METERS = 2000;

export const MAX_WHEEL_SEGMENTS = 12;
