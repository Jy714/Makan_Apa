import { boundingBox, calculateDistanceMeters, formatDistance, formatRadius } from "../utils/distance";

describe("calculateDistanceMeters", () => {
  it("returns ~0 for identical coordinates", () => {
    expect(calculateDistanceMeters(3.1466, 101.7113, 3.1466, 101.7113)).toBeCloseTo(0, 6);
  });

  it("returns a short distance for nearby points (~111 m per 0.001° latitude)", () => {
    const d = calculateDistanceMeters(3.1466, 101.7113, 3.1476, 101.7113);
    expect(d).toBeGreaterThan(105);
    expect(d).toBeLessThan(115);
  });

  it("matches a known pair: KLCC → George Town is roughly 290 km", () => {
    const d = calculateDistanceMeters(3.1579, 101.7116, 5.4164, 100.3327);
    expect(d / 1000).toBeGreaterThan(285);
    expect(d / 1000).toBeLessThan(300);
  });

  it("is symmetric", () => {
    const a = calculateDistanceMeters(1.4627, 103.7618, 2.1951, 102.2467);
    const b = calculateDistanceMeters(2.1951, 102.2467, 1.4627, 103.7618);
    expect(a).toBeCloseTo(b, 6);
  });
});

describe("formatDistance", () => {
  it.each([
    [7, "7 m"],
    [347, "350 m"],
    [900, "900 m"],
    [994, "990 m"],
    [996, "1.0 km"],
    [1400, "1.4 km"],
    [4980, "5.0 km"],
    [12_400, "12 km"],
  ])("%d m → %s", (m, out) => {
    expect(formatDistance(m)).toBe(out);
  });

  it("handles invalid input", () => {
    expect(formatDistance(NaN)).toBe("—");
    expect(formatDistance(-5)).toBe("—");
  });
});

describe("formatRadius", () => {
  it("formats radius options", () => {
    expect(formatRadius(500)).toBe("500 m");
    expect(formatRadius(2000)).toBe("2 km");
  });
});

describe("boundingBox", () => {
  it("contains the whole search circle", () => {
    const lat = 3.1466;
    const lon = 101.7113;
    const r = 2000;
    const b = boundingBox(lat, lon, r);
    expect(calculateDistanceMeters(lat, lon, b.north, lon)).toBeGreaterThanOrEqual(r - 1);
    expect(calculateDistanceMeters(lat, lon, lat, b.east)).toBeGreaterThanOrEqual(r - 1);
    expect(b.south).toBeLessThan(lat);
    expect(b.west).toBeLessThan(lon);
  });
});
