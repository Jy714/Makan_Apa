import type { GeoapifyFeature } from "../types/geoapify";
import { categoryFromGeoapify, cuisineFromCategories } from "../utils/categories";
import { buildDirectionsLink, buildOsmLink, isValidCoordinate } from "../utils/mapLinks";
import { deduplicatePlaces, normaliseGeoapifyFeatures, safeUrl } from "../utils/normalise";

const centre = { latitude: 3.1466, longitude: 101.7113 };

const feature = (properties: GeoapifyFeature["properties"]): GeoapifyFeature => ({
  type: "Feature",
  properties,
  geometry: properties?.lon !== undefined && properties?.lat !== undefined
    ? { type: "Point", coordinates: [properties.lon, properties.lat] }
    : undefined,
});

const features: GeoapifyFeature[] = [
  feature({
    place_id: "p1",
    name: "Restoran Contoh",
    lat: 3.147,
    lon: 101.7115,
    categories: ["catering", "catering.restaurant", "catering.restaurant.malaysian"],
    housenumber: "12",
    street: "Jalan Alor",
    city: "Kuala Lumpur",
    formatted: "Restoran Contoh, 12 Jalan Alor, Kuala Lumpur",
    opening_hours: "Mo-Su 07:00-23:00",
    website: "example.com",
    contact: { phone: "+60 3-1234 5678" },
  }),
  feature({
    place_id: "p2",
    name: "Kedai Roti",
    lat: 3.148,
    lon: 101.712,
    categories: ["commercial", "commercial.food_and_drink", "commercial.food_and_drink.bakery"],
  }),
  feature({ place_id: "p3", lat: 3.149, lon: 101.713, categories: ["catering.cafe"] }), // unnamed
  feature({ place_id: "p4", name: "Bad Coords", lat: 999, lon: 101.713, categories: ["catering.cafe"] }),
  feature({ place_id: "p5", name: "Medan Selera", lat: 3.15, lon: 101.71, categories: ["catering.food_court"] }),
  feature({
    place_id: "p6",
    name: "Aiskrim",
    lat: 3.1466,
    lon: 101.7113,
    categories: ["catering.cafe", "catering.cafe.dessert"],
    datasource: { raw: { cuisine: "ice_cream", opening_hours: "10:00-22:00" } },
  }),
  // Coordinates only in geometry.
  { properties: { place_id: "p7", name: "Kopi Corner", categories: ["catering.cafe.coffee_shop"] }, geometry: { coordinates: [101.712, 3.147] } },
];

describe("normaliseGeoapifyFeatures", () => {
  const places = normaliseGeoapifyFeatures(features, centre);
  const byId = Object.fromEntries(places.map((p) => [p.id, p]));

  it("keeps named, locatable places only", () => {
    expect(places.map((p) => p.id).sort()).toEqual(["p1", "p2", "p5", "p6", "p7"]);
  });

  it("maps categories", () => {
    expect(byId.p1.category).toBe("restaurant");
    expect(byId.p2.category).toBe("bakery_dessert");
    expect(byId.p5.category).toBe("food_court_stall");
    expect(byId.p6.category).toBe("bakery_dessert");
    expect(byId.p7.category).toBe("cafe");
  });

  it("falls back to geometry coordinates", () => {
    expect(byId.p7.latitude).toBe(3.147);
    expect(byId.p7.longitude).toBe(101.712);
  });

  it("extracts optional fields and leaves missing data missing", () => {
    const p = byId.p1;
    expect(p.cuisine).toBe("Malaysian");
    expect(p.address).toBe("12 Jalan Alor, Kuala Lumpur");
    expect(p.openingHours).toBe("Mo-Su 07:00-23:00");
    expect(p.website).toBe("https://example.com/");
    expect(p.phone).toBe("+60 3-1234 5678");
    expect(p.estimatedPriceRm).toBeUndefined();
    const roti = byId.p2;
    expect(roti.address).toBeUndefined();
    expect(roti.cuisine).toBeUndefined();
    expect(roti.openingHours).toBeUndefined();
  });

  it("reads raw datasource tags when top-level fields are absent", () => {
    expect(byId.p6.cuisine).toBe("Ice cream");
    expect(byId.p6.openingHours).toBe("10:00-22:00");
  });

  it("computes distance from the centre with Haversine", () => {
    expect(byId.p6.distanceMeters).toBeCloseTo(0, 3);
    expect(byId.p1.distanceMeters).toBeGreaterThan(30);
    expect(byId.p1.distanceMeters).toBeLessThan(60);
  });
});

describe("category helpers", () => {
  it("prefers food court > restaurant > fast food > dessert > café", () => {
    expect(categoryFromGeoapify(["catering.restaurant", "catering.food_court"])).toBe("food_court_stall");
    expect(categoryFromGeoapify(["catering.fast_food.burger"])).toBe("fast_food");
    expect(categoryFromGeoapify(["catering.ice_cream"])).toBe("bakery_dessert");
    expect(categoryFromGeoapify(["commercial.food_and_drink.confectionery"])).toBe("bakery_dessert");
    expect(categoryFromGeoapify(["catering.cafe.bubble_tea"])).toBe("cafe");
    expect(categoryFromGeoapify(["catering"])).toBe("other");
  });

  it("derives cuisine only from provider category keys", () => {
    expect(cuisineFromCategories(["catering.restaurant.chinese", "catering.restaurant"])).toBe("chinese");
    expect(cuisineFromCategories(["catering.cafe"])).toBeUndefined();
  });
});

describe("deduplicatePlaces", () => {
  it("removes duplicates by place id, keeping the first", () => {
    const dup = normaliseGeoapifyFeatures([features[0], features[0], features[1]], centre);
    expect(dup).toHaveLength(3);
    expect(deduplicatePlaces(dup).map((p) => p.id)).toEqual(["p1", "p2"]);
  });
});

describe("safeUrl", () => {
  it("rejects non-http schemes", () => {
    expect(safeUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeUrl("ftp://x.com")).toBeUndefined();
    expect(safeUrl("https://ok.my")).toBe("https://ok.my/");
  });
});

describe("map links", () => {
  it("builds OpenStreetMap links", () => {
    expect(buildOsmLink(3.1466, 101.7113)).toBe(
      "https://www.openstreetmap.org/?mlat=3.146600&mlon=101.711300#map=18/3.146600/101.711300"
    );
  });

  it("builds Google Maps directions links", () => {
    expect(buildDirectionsLink(3.1466, 101.7113)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=3.146600,101.711300"
    );
  });

  it("refuses invalid coordinates", () => {
    expect(isValidCoordinate(91, 0)).toBe(false);
    expect(buildOsmLink(NaN, 1)).toBeNull();
    expect(buildDirectionsLink(0, 181)).toBeNull();
  });
});
