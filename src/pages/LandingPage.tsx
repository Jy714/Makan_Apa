import { ArrowRight, Coffee, Dices, Footprints, LocateFixed, MapPin, ShieldCheck, SlidersHorizontal, Soup, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { WheelGraphic } from "../components/WheelGraphic";
import type { NearbyNavState } from "./NearbyFoodPage";

const startState: NearbyNavState = { startLocation: true };

// Dish names only — decorative, not real places.
const HERO_LABELS = ["Nasi lemak", "Char kway teow", "Roti canai", "Laksa", "Chicken rice", "Satay", "Mee goreng", "Dim sum"];

const STEPS = [
  {
    icon: LocateFixed,
    title: "Find nearby food",
    body: "Allow location access to discover food places around you.",
  },
  {
    icon: SlidersHorizontal,
    title: "Set your preferences",
    body: "Choose a distance, food category, and available budget filter.",
  },
  {
    icon: Dices,
    title: "Spin and decide",
    body: "Let the wheel choose a place from your eligible results.",
  },
];

const PREVIEW_ROWS = [
  { name: "Sample Mamak Corner", cat: "Restaurant · Indian", dist: "350 m" },
  { name: "Sample Kopitiam", cat: "Café · Malaysian", dist: "620 m" },
  { name: "Sample Bakery", cat: "Bakery & desserts", dist: "1.1 km" },
];

function FindFoodCta({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/nearby"
      state={startState}
      className={`btn-primary group px-7 py-4 text-base shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 ${className}`}
    >
      <MapPin className="h-5 w-5" aria-hidden="true" />
      Find Food Near Me
      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  );
}

export function LandingPage() {
  // Decorative practice spin: always lands somewhere random, never "picks" anything.
  const [previewRotation, setPreviewRotation] = useState(-12);
  const spinPreview = () => setPreviewRotation((r) => r + 720 + Math.floor(Math.random() * 360));

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header>
        <a href="#how-it-works" className="btn-ghost px-3">
          How it works
        </a>
      </Header>

      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-40 -top-24 h-[480px] w-[480px] rounded-full bg-saffron/20 blur-3xl"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-2 lg:gap-16 lg:pb-24">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted">
                <Sparkles className="h-3.5 w-3.5 text-tomato" aria-hidden="true" />
                Free · Open source · Made for Malaysia
              </p>
              <h1 className="mt-5 font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Makan Apa <span className="text-tomato">Today?</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted sm:text-xl">
                Can't decide what to eat? Discover food near you and let the wheel decide.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <FindFoodCta className="w-full sm:w-auto" />
              </div>
              <p className="mt-4 flex max-w-md items-start gap-2 text-sm text-muted">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                We'll use your location to find food nearby. Your precise location isn't saved by this website.
              </p>
              <p className="mt-2 max-w-md pl-6 text-xs text-muted">
                First time? You'll be guided to add a free Geoapify API key (about a minute, no credit card).
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-[460px]">
              <div className="float-slow absolute -left-2 top-8 z-10 hidden sm:block">
                <div className="group flex cursor-default rotate-[-6deg] items-center gap-2 rounded-2xl border border-line bg-surface px-3 py-2 text-sm font-semibold shadow-card transition-all duration-300 ease-out hover:rotate-0 hover:scale-125 hover:border-tomato/40 hover:shadow-lg">
                  <Soup className="h-5 w-5 text-tomato transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110" aria-hidden="true" />
                  Hungry?
                </div>
              </div>
              <div className="float-slow float-delay absolute -right-2 bottom-10 z-10 hidden sm:block">
                <div className="group flex cursor-default rotate-[5deg] items-center gap-2 rounded-2xl border border-line bg-surface px-3 py-2 text-sm font-semibold shadow-card transition-all duration-300 ease-out hover:rotate-0 hover:scale-125 hover:border-tomato/40 hover:shadow-lg">
                  <Coffee className="h-5 w-5 text-tomato transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" aria-hidden="true" />
                  Teh tarik after?
                </div>
              </div>
              <button
                type="button"
                onClick={spinPreview}
                aria-label="Give the preview wheel a spin (just for fun)"
                className="block w-full rounded-[2.5rem] border border-line bg-surface/70 p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-tomato/30 hover:shadow-xl sm:p-8"
              >
                <WheelGraphic labels={HERO_LABELS} rotation={previewRotation} durationMs={2600} className="h-auto w-full" />
              </button>
              <p className="mt-3 text-center text-xs text-muted">
                Tap the wheel for a practice spin — real picks come from places near you.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 border-y border-line bg-surface/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-2 max-w-xl text-muted">Three quick steps from “makan apa?” to “jom, let's go”.</p>
            <ol className="mt-10 grid gap-5 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li
                  key={s.title}
                  className="card group p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-tomato/30 hover:shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-tomato-soft text-tomato transition-all duration-300 group-hover:rotate-[-8deg] group-hover:scale-110 group-hover:bg-tomato group-hover:text-white">
                      <s.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-bold text-muted">Step {i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                  <p className="mt-1 text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Product preview */}
        <section aria-labelledby="preview-heading" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <h2 id="preview-heading" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Real places. Honest details.
              </h2>
              <p className="mt-3 max-w-md text-muted">
                Makan Apa searches open map data (OpenStreetMap, via Geoapify) around you. We show what the data actually says — no
                made-up ratings, photos or prices. When a price isn't listed, you'll see “Price unknown”.
              </p>
              <FindFoodCta className="mt-8 w-full sm:w-auto" />
            </div>

            <div className="card relative p-5 sm:p-6" aria-label="Demo preview with sample names">
              <span className="absolute right-4 top-4 rounded-full bg-saffron/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink">
                Demo preview
              </span>
              <p className="text-sm font-semibold text-muted">3 eligible places · within 2 km</p>
              <ul className="mt-4 space-y-3" aria-label="Sample results (not real places)">
                {PREVIEW_ROWS.map((r) => (
                  <li
                    key={r.name}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-line p-4 transition-all duration-200 hover:translate-x-1 hover:border-tomato/40 hover:bg-cream"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold">{r.name}</p>
                      <p className="text-sm text-muted">{r.cat} · Price unknown</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-xs font-semibold">
                      <Footprints className="h-3.5 w-3.5" aria-hidden="true" />
                      {r.dist}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-center gap-2 rounded-full bg-tomato py-3 text-sm font-semibold text-white" aria-hidden="true">
                <Dices className="h-5 w-5" /> Spin the Wheel
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
