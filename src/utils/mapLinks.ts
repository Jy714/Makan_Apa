export function isValidCoordinate(lat: number, lon: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lon === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

const fmt = (n: number) => n.toFixed(6);

export function buildOsmLink(lat: number, lon: number): string | null {
  if (!isValidCoordinate(lat, lon)) return null;
  const la = fmt(lat);
  const lo = fmt(lon);
  return `https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=18/${la}/${lo}`;
}

export function buildDirectionsLink(lat: number, lon: number): string | null {
  if (!isValidCoordinate(lat, lon)) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${fmt(lat)},${fmt(lon)}`;
}
