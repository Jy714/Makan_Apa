import L from "leaflet";
import { useEffect, useState } from "react";
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { TILE_ATTRIBUTION, tileUrl } from "../config/mapConfig";
import type { Coordinates, Place } from "../types/place";
import { formatDistance } from "../utils/distance";

const placeIcon = L.divIcon({ className: "", html: '<div class="pin pin--place"></div>', iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -26] });
const selectedIcon = L.divIcon({ className: "", html: '<div class="pin pin--selected"></div>', iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -34] });
const centreIcon = L.divIcon({ className: "", html: '<div class="centre-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });

/**
 * Fits the map to `bounds` and keeps it fitted whenever the container's size changes.
 * A map inside a hidden panel or a just-opened dialog measures 0×0 at first, so this
 * re-measures once it becomes visible.
 */
function FitBounds({ south, west, north, east, maxZoom }: { south: number; west: number; north: number; east: number; maxZoom?: number }) {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const fit = () => {
      if (container.clientWidth === 0 || container.clientHeight === 0) return;
      map.invalidateSize();
      // Extra top padding so pins (anchored at their tip) aren't clipped at the top edge.
      map.fitBounds(L.latLngBounds([south, west], [north, east]), {
        paddingTopLeft: [28, 48],
        paddingBottomRight: [28, 20],
        maxZoom,
      });
    };
    fit();
    let lastSize = "";
    const observer = new ResizeObserver(() => {
      const size = `${container.clientWidth}x${container.clientHeight}`;
      if (size !== lastSize) {
        lastSize = size;
        fit();
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map, south, west, north, east, maxZoom]);
  return null;
}

function MapController({ centre, radiusMeters }: { centre: Coordinates; radiusMeters: number }) {
  const b = L.latLng(centre.latitude, centre.longitude).toBounds(radiusMeters * 2);
  return <FitBounds south={b.getSouth()} west={b.getWest()} north={b.getNorth()} east={b.getEast()} />;
}

type Props = {
  apiKey: string;
  centre: Coordinates;
  centreLabel: string;
  radiusMeters: number;
  places: Place[];
  selectedId: string | null;
};

export function FoodMap({ apiKey, centre, centreLabel, radiusMeters, places, selectedId }: Props) {
  // MapContainer only reads `center` once; later moves are handled by MapController.
  const [initialCentre] = useState<[number, number]>(() => [centre.latitude, centre.longitude]);

  return (
    <div className="h-full min-h-[320px] overflow-hidden rounded-3xl border border-line">
      <MapContainer center={initialCentre} zoom={15} zoomSnap={0.25} scrollWheelZoom={false} className="h-full min-h-[320px] w-full">
        <TileLayer key={apiKey} url={tileUrl(apiKey)} attribution={TILE_ATTRIBUTION} maxZoom={20} />
        <MapController centre={centre} radiusMeters={radiusMeters} />
        <Circle
          center={[centre.latitude, centre.longitude]}
          radius={radiusMeters}
          pathOptions={{ color: "#C8472B", weight: 1.5, fillOpacity: 0.04, dashArray: "4 6" }}
        />
        <Marker position={[centre.latitude, centre.longitude]} icon={centreIcon} zIndexOffset={1000}>
          <Popup>Search centre: {centreLabel}</Popup>
        </Marker>
        {places.map((p) => (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={p.id === selectedId ? selectedIcon : placeIcon}
            zIndexOffset={p.id === selectedId ? 900 : 0}
            title={p.name}
          >
            <Popup>
              <strong>{p.name}</strong>
              <br />
              {formatDistance(p.distanceMeters)} away
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

type MiniMapProps = {
  apiKey: string;
  centre: Coordinates;
  centreLabel: string;
  place: Place;
};

/** Small map showing where the picked place is relative to the search centre. */
export function PlaceMiniMap({ apiKey, centre, centreLabel, place }: MiniMapProps) {
  const [initialCentre] = useState<[number, number]>(() => [place.latitude, place.longitude]);
  return (
    <MapContainer
      center={initialCentre}
      zoom={16}
      zoomSnap={0.25}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer key={apiKey} url={tileUrl(apiKey)} attribution={TILE_ATTRIBUTION} maxZoom={20} />
      <FitBounds
        south={Math.min(centre.latitude, place.latitude)}
        west={Math.min(centre.longitude, place.longitude)}
        north={Math.max(centre.latitude, place.latitude)}
        east={Math.max(centre.longitude, place.longitude)}
        maxZoom={17}
      />
      <Polyline
        positions={[
          [centre.latitude, centre.longitude],
          [place.latitude, place.longitude],
        ]}
        pathOptions={{ color: "#C8472B", weight: 2, dashArray: "4 6" }}
      />
      <Marker position={[centre.latitude, centre.longitude]} icon={centreIcon} title={`Search centre: ${centreLabel}`} />
      <Marker position={[place.latitude, place.longitude]} icon={selectedIcon} title={place.name} zIndexOffset={900} />
    </MapContainer>
  );
}
