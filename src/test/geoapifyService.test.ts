import { PLACES_LIMIT } from "../config/mapConfig";
import { buildPlacesUrl, fetchNearbyPlaces, PlacesError } from "../services/geoapifyService";

const centre = { latitude: 3.1466, longitude: 101.7113 };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const pt = (id: string, lat: number, lon: number, name = id) => ({
  type: "Feature",
  properties: { place_id: id, name, lat, lon, categories: ["catering.cafe"] },
  geometry: { type: "Point", coordinates: [lon, lat] },
});

afterEach(() => vi.unstubAllGlobals());

describe("buildPlacesUrl", () => {
  it("uses lon,lat order, a circle filter, proximity bias and food-only categories", () => {
    const url = new URL(buildPlacesUrl(centre, 2000, "KEY"));
    expect(url.origin + url.pathname).toBe("https://api.geoapify.com/v2/places");
    expect(url.searchParams.get("filter")).toBe("circle:101.711300,3.146600,2000");
    expect(url.searchParams.get("bias")).toBe("proximity:101.711300,3.146600");
    expect(url.searchParams.get("limit")).toBe(String(PLACES_LIMIT));
    expect(url.searchParams.get("apiKey")).toBe("KEY");
    const cats = url.searchParams.get("categories")!.split(",");
    expect(cats).toContain("catering.restaurant");
    expect(cats).toContain("commercial.food_and_drink.bakery");
    expect(cats.some((c) => /bar|pub|biergarten|taproom/.test(c))).toBe(false);
  });
});

describe("fetchNearbyPlaces", () => {
  it("normalises, filters by radius and sorts by distance", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        json({
          type: "FeatureCollection",
          features: [
            pt("far", 3.155, 101.7113),
            pt("near", 3.147, 101.7113),
            pt("outside", 3.1646, 101.7293), // ~2.8 km: outside the 2 km circle
          ],
        })
      )
    );
    const res = await fetchNearbyPlaces(centre, 2000, "KEY");
    expect(res.places.map((p) => p.id)).toEqual(["near", "far"]);
    expect(res.truncated).toBe(false);
  });

  it("flags truncation when the limit is reached", async () => {
    const many = Array.from({ length: PLACES_LIMIT }, (_, i) => pt(`p${i}`, 3.1466 + i * 1e-6, 101.7113));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ features: many })));
    expect((await fetchNearbyPlaces(centre, 2000, "KEY")).truncated).toBe(true);
  });

  it("refuses to call the API without a key", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchNearbyPlaces(centre, 2000, "  ")).rejects.toMatchObject({ appError: { code: "api_key_missing" } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [401, "api_key_invalid"],
    [403, "api_key_invalid"],
    [429, "api_rate_limited"],
    [500, "api_http"],
  ])("maps HTTP %d to %s without retrying", async (status, code) => {
    const fetchMock = vi.fn().mockResolvedValue(json({ message: "x" }, status));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchNearbyPlaces(centre, 2000, "KEY")).rejects.toMatchObject({ appError: { code } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports malformed responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => new Response("<html>", { status: 200 })));
    await expect(fetchNearbyPlaces(centre, 2000, "KEY")).rejects.toMatchObject({ appError: { code: "api_malformed" } });
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => json({ nope: true })));
    await expect(fetchNearbyPlaces(centre, 2000, "KEY")).rejects.toBeInstanceOf(PlacesError);
  });

  it("reports network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(fetchNearbyPlaces(centre, 2000, "KEY")).rejects.toMatchObject({ appError: { code: "api_network" } });
  });
});
