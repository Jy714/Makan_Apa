/** Uniform random integer in [0, max). Uses crypto.getRandomValues with rejection sampling. */
export function randomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0) throw new RangeError("max must be a positive integer");
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === "function") {
    const limit = Math.floor(0x1_0000_0000 / max) * max;
    const buf = new Uint32Array(1);
    // Rejection sampling avoids modulo bias.
    do {
      c.getRandomValues(buf);
    } while (buf[0] >= limit);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function chooseRandomPlace<T>(items: readonly T[]): T | null {
  if (items.length === 0) return null;
  return items[randomInt(items.length)];
}

/** Uniform random subset (Fisher–Yates partial shuffle). Order of the result is random. */
export function randomSubset<T>(items: readonly T[], size: number): T[] {
  const copy = items.slice();
  const n = Math.min(size, copy.length);
  for (let i = 0; i < n; i++) {
    const j = i + randomInt(copy.length - i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}
