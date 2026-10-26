import { Dices, RefreshCw } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { MAX_WHEEL_SEGMENTS } from "../config/mapConfig";
import type { Place } from "../types/place";
import { randomInt, randomSubset } from "../utils/random";
import { WheelGraphic } from "./WheelGraphic";

const SPIN_MS = 4200;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Rotation (deg, clockwise) that brings the centre of segment `index` under the 12 o'clock pointer. */
export function targetRotation(current: number, index: number, count: number, extraTurns = 6): number {
  const seg = 360 / count;
  // Land somewhere inside the segment (not on an edge), so the result is visually unambiguous.
  const jitter = count > 1 ? (Math.random() - 0.5) * seg * 0.6 : 0;
  const desired = (((360 - (index * seg + seg / 2 + jitter)) % 360) + 360) % 360;
  const currentMod = ((current % 360) + 360) % 360;
  const delta = (desired - currentMod + 360) % 360;
  return current + extraTurns * 360 + delta;
}

type Props = {
  eligible: Place[];
  onResult: (place: Place) => void;
  onSpinningChange: (spinning: boolean) => void;
};

export type FoodRouletteHandle = { spin: () => void };

export const FoodRoulette = forwardRef<FoodRouletteHandle, Props>(function FoodRoulette(
  { eligible, onResult, onSpinningChange },
  ref
) {
  const eligibleKey = eligible.map((p) => p.id).join("|");
  const [subsetSeed, setSubsetSeed] = useState(0);
  const wheelPlaces = useMemo(
    () => (eligible.length > MAX_WHEEL_SEGMENTS ? randomSubset(eligible, MAX_WHEEL_SEGMENTS) : eligible),
    [eligibleKey, subsetSeed]
  );

  const [rotation, setRotation] = useState(0);
  const [duration, setDuration] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [landedIndex, setLandedIndex] = useState<number | null>(null);
  const mounted = useRef(true);

  // A mounted flag rather than clearTimeout on unmount: StrictMode's simulated unmount/remount can
  // run after the first click and would otherwise cancel that spin, leaving the wheel stuck.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  // A new wheel means the old highlight no longer refers to anything.
  useEffect(() => setLandedIndex(null), [wheelPlaces]);

  const spin = () => {
    if (spinning || wheelPlaces.length === 0) return;
    const index = randomInt(wheelPlaces.length);
    const chosen = wheelPlaces[index];
    const ms = prefersReducedMotion() ? 0 : SPIN_MS;
    setLandedIndex(null);
    setSpinning(true);
    onSpinningChange(true);
    setDuration(ms);
    setRotation((r) => targetRotation(r, index, wheelPlaces.length, ms ? 6 : 0));
    window.setTimeout(() => {
      if (!mounted.current) {
        onSpinningChange(false); // Keep the page from staying in "spinning" mode.
        return;
      }
      setSpinning(false);
      onSpinningChange(false);
      setLandedIndex(index);
      onResult(chosen);
    }, ms + 60);
  };

  useImperativeHandle(ref, () => ({ spin }));

  const n = wheelPlaces.length;
  const subsetShown = eligible.length > MAX_WHEEL_SEGMENTS;

  return (
    <section aria-labelledby="wheel-heading" className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="wheel-heading" className="font-display text-2xl font-bold">
            Spin the Wheel
          </h2>
          <p className="mt-1 text-sm text-muted">
            {n === 0
              ? "No eligible places to spin yet."
              : subsetShown
                ? `Showing ${n} of ${eligible.length} eligible places. The wheel only picks from what you see.`
                : `Picking from ${n} eligible place${n === 1 ? "" : "s"}.`}
          </p>
        </div>
        {subsetShown && (
          <button
            type="button"
            className="btn-ghost shrink-0 px-3"
            onClick={() => setSubsetSeed((s) => s + 1)}
            disabled={spinning}
            aria-label="Shuffle which places appear on the wheel"
            title="Shuffle wheel places"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Shuffle</span>
          </button>
        )}
      </div>

      <div className="mx-auto mt-4 w-full max-w-[360px]">
        <WheelGraphic
          labels={wheelPlaces.map((p) => p.name)}
          rotation={rotation}
          durationMs={duration}
          highlightIndex={landedIndex}
          className="h-auto w-full"
        />
      </div>

      <button
        type="button"
        onClick={spin}
        disabled={spinning || n === 0}
        className="btn-primary mt-5 w-full text-base"
        aria-describedby="wheel-heading"
      >
        <Dices className={`h-5 w-5 ${spinning ? "animate-spin" : ""}`} aria-hidden="true" />
        {spinning ? "Spinning…" : landedIndex !== null ? "Spin again" : "Spin the Wheel"}
      </button>
      {n === 0 && (
        <p className="mt-3 text-center text-sm text-muted">
          Try a bigger radius, another category, or clear your filters.
        </p>
      )}
    </section>
  );
});
