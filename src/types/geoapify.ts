/** Subset of the Geoapify Places API v2 response we rely on. Every field is treated as optional. */
export type GeoapifyProperties = {
  place_id?: string;
  name?: string;
  lat?: number;
  lon?: number;
  categories?: string[];
  formatted?: string;
  address_line1?: string;
  address_line2?: string;
  housenumber?: string;
  street?: string;
  suburb?: string;
  city?: string;
  postcode?: string;
  opening_hours?: string;
  website?: string;
  contact?: { phone?: string };
  catering?: { cuisine?: string };
  datasource?: { raw?: Record<string, string | number | boolean | undefined> };
};

export type GeoapifyFeature = {
  type?: "Feature";
  properties?: GeoapifyProperties;
  geometry?: { type?: string; coordinates?: [number, number] };
};

export type GeoapifyResponse = {
  type?: "FeatureCollection";
  features: GeoapifyFeature[];
};
