import type { Coordinates } from "../types/place";

/**
 * Manual fallback when location access isn't possible. These are public landmarks,
 * not the user's location, and the UI labels them as such.
 */
export const CITY_CENTRES: { id: string; label: string; coords: Coordinates }[] = [
  { id: "kl", label: "Kuala Lumpur (Bukit Bintang)", coords: { latitude: 3.1466, longitude: 101.7113 } },
  { id: "pj", label: "Petaling Jaya (SS2)", coords: { latitude: 3.1182, longitude: 101.6224 } },
  { id: "penang", label: "George Town, Penang", coords: { latitude: 5.4164, longitude: 100.3327 } },
  { id: "jb", label: "Johor Bahru city centre", coords: { latitude: 1.4627, longitude: 103.7618 } },
  { id: "ipoh", label: "Ipoh Old Town", coords: { latitude: 4.5975, longitude: 101.0789 } },
  { id: "melaka", label: "Melaka (Jonker Street)", coords: { latitude: 2.1951, longitude: 102.2467 } },
  { id: "kk", label: "Kota Kinabalu city centre", coords: { latitude: 5.9804, longitude: 116.0735 } },
  { id: "kuching", label: "Kuching Waterfront", coords: { latitude: 1.5589, longitude: 110.3446 } },
];
