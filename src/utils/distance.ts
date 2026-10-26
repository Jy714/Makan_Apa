const EARTH_RADIUS_METERS = 6_371_008.8;

const toRadians = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle (straight-line) distance between two points using the Haversine formula. */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** 350 → "350 m", 1400 → "1.4 km". */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "—";
  const rounded = meters < 100 ? Math.round(meters) : Math.round(meters / 10) * 10;
  if (rounded < 1000) return `${rounded} m`;
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export function formatRadius(meters: number): string {
  return meters < 1000 ? `${meters} m` : `${meters / 1000} km`;
}

/** Bounding box that fully contains a circle of `radiusMeters` around the centre. */
export function boundingBox(lat: number, lon: number, radiusMeters: number) {
  const latDelta = (radiusMeters / EARTH_RADIUS_METERS) * (180 / Math.PI);
  const lonDelta = latDelta / Math.max(Math.cos(toRadians(lat)), 0.01);
  return {
    south: lat - latDelta,
    west: lon - lonDelta,
    north: lat + latDelta,
    east: lon + lonDelta,
  };
}
