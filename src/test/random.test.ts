import { targetRotation } from "../components/FoodRoulette";
import { chooseRandomPlace, randomInt, randomSubset } from "../utils/random";
import { makePlace } from "./fixtures";

describe("randomInt", () => {
  it("stays within [0, max)", () => {
    for (let i = 0; i < 2000; i++) {
      const n = randomInt(7);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(7);
      expect(Number.isInteger(n)).toBe(true);
    }
  });

  it("rejects invalid max", () => {
    expect(() => randomInt(0)).toThrow(RangeError);
  });

  it("covers every index (roughly uniform)", () => {
    const counts = new Array(4).fill(0);
    for (let i = 0; i < 4000; i++) counts[randomInt(4)]++;
    for (const c of counts) expect(c).toBeGreaterThan(800);
  });
});

describe("chooseRandomPlace", () => {
  const pool = [makePlace({ id: "node/1" }), makePlace({ id: "node/2" }), makePlace({ id: "node/3" })];

  it("returns a member of the eligible pool", () => {
    for (let i = 0; i < 100; i++) expect(pool).toContain(chooseRandomPlace(pool));
  });

  it("returns the only place for single-item pools", () => {
    expect(chooseRandomPlace([pool[0]])).toBe(pool[0]);
  });

  it("returns null for an empty pool", () => {
    expect(chooseRandomPlace([])).toBeNull();
  });
});

describe("randomSubset", () => {
  it("returns distinct members, capped at size", () => {
    const items = Array.from({ length: 30 }, (_, i) => i);
    const sub = randomSubset(items, 12);
    expect(sub).toHaveLength(12);
    expect(new Set(sub).size).toBe(12);
    sub.forEach((x) => expect(items).toContain(x));
  });

  it("returns everything when the pool is smaller than size", () => {
    expect(randomSubset([1, 2, 3], 12).sort()).toEqual([1, 2, 3]);
  });
});

describe("targetRotation", () => {
  // The segment under the 12 o'clock pointer after rotating clockwise by R is floor(((-R mod 360)) / seg).
  const segmentUnderPointer = (rotation: number, count: number) => {
    const angle = (((-rotation) % 360) + 360) % 360;
    return Math.floor(angle / (360 / count));
  };

  it("always lands on the chosen segment", () => {
    let current = 0;
    for (let trial = 0; trial < 500; trial++) {
      const count = 1 + (trial % 12);
      const index = trial % count;
      current = targetRotation(current, index, count);
      expect(segmentUnderPointer(current, count)).toBe(index);
    }
  });

  it("only ever spins forward", () => {
    expect(targetRotation(1000, 3, 8)).toBeGreaterThan(1000);
  });
});
