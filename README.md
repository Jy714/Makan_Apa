# Makan Apa

**Find food nearby. Let the wheel decide.**

Makan Apa ("what should we eat?" in Malay) is a free, open-source, front-end-only website. It finds food places near you and lets a roulette wheel pick one.

- **No custom backend, no database, no accounts, no analytics.**
- Place search and map tiles come from **[Geoapify](https://www.geoapify.com/)**. Its free plan gives 3,000 credits per day and needs no credit card. Each visitor or deployer **brings their own free API key** (BYOK), so running the site costs you nothing.

## Pages

| Route | What it does |
|---|---|
| `/` | Landing page: hero with **Find Food Near Me**, a privacy note, "How it works", a clearly labelled demo preview, and a footer with attribution. Location is **not** requested here. |
| `/nearby` | The app: API-key setup (first visit only) → location → nearby-place search → filters → wheel, list and map → **Today's Pick** with map and directions links. |

Clicking **Find Food Near Me** goes to `/nearby` with a one-time router-state intent (no coordinates in the URL), which starts the location request:

- If there's no API key yet, the key panel appears first. As soon as a key is saved, the location request continues.
- Opening `/nearby` directly shows a **Use my location** button instead of requesting location automatically.

## Getting a Geoapify API key (free)

1. Sign up at <https://myprojects.geoapify.com/>. You don't need a credit card.
2. Create a project and copy its API key.
3. Choose one way to use it:
   - **As a visitor:** paste the key into the panel on `/nearby`. It's stored only in your browser's `localStorage` and is sent only to Geoapify. Use **API key → Remove my key** to delete it.
   - **As a deployer:** copy `.env.example` to `.env.local` and set `VITE_GEOAPIFY_API_KEY=...`. The key is then built into the site for every visitor. A key a visitor saves themselves always takes priority over this one.
4. **Recommended:** in the Geoapify project settings, restrict the key to your site's origin (for example `https://makan-apa.example.com`, plus `http://localhost:5173` for development). Geoapify keys are designed for browser use, but restricting the origin stops other sites from spending your credits.

**Credit usage:**

- Each search requests up to 200 places. At 1 credit per 20 places, that's at most 10 credits per search, so the free 3,000 credits/day covers about 300+ searches.
- Map tiles use a small number of credits as you pan and zoom.
- Results are saved in the browser for 24 hours (see *Saved searches* below). Searching the same spot again, changing filters, or making the radius smaller costs nothing.

## Features

- **Location:** one-shot browser geolocation (`getCurrentPosition`, never `watchPosition`), requested only after a click.
- **Manual fallback:** if location is blocked or unavailable, pick a Malaysian city centre instead.
- **Geoapify place search** covers:
  - restaurants, fast food, cafés, food courts and ice cream (`catering.*`)
  - bakeries and confectionery (`commercial.food_and_drink.*`)
  - Bars and pubs are excluded.
- **Radius:** 500 m / 1 km / **2 km (default)** / 5 km. Distances use the Haversine formula, and the final radius filter runs in the browser.
- **Filters:**
  - category, budget, and an **Include places with unknown prices** toggle
  - All filtering happens locally on the fetched data, so changing a filter never makes a new request.
  - The list, map, eligible count and wheel always use the same filtered set.
- **Wheel:**
  - Picks uniformly at random using `crypto.getRandomValues` (with rejection sampling, and `Math.random` as a fallback).
  - The wheel stops on the chosen segment, and the result card always matches it.
  - With more than 12 eligible places, a random subset of 12 is shown ("Showing 12 of N"). The wheel only picks from what's visible, and **Shuffle** draws a new subset.
- **States:** loading, invalid key, quota exhausted, permission denied, timeout, unsupported browser, network error, no results and no filter matches. Each has a recovery action.
- **Accessibility:**
  - Respects `prefers-reduced-motion` (the wheel lands instantly).
  - Keyboard accessible, with visible focus rings, labelled inputs and `aria-live` announcements.
  - Every card has a **Pick this one** button, so the wheel is never the only way to choose.

## Tech stack

React 18 · TypeScript (strict) · Vite 5 · Tailwind CSS 3 · React Router 6 · Lucide React · Leaflet + React Leaflet · Vitest + React Testing Library.

## Running locally

You need Node.js 18+ (developed on Node 22) and npm.

```bash
npm install
npm run dev        # http://localhost:5173
npm run test       # run unit + UI tests once
npm run build      # type-check and build to dist/
npm run preview    # serve the production build locally
```

`npm run typecheck` runs the TypeScript checker on its own. Geolocation only works on **HTTPS or `localhost`**.

## Project structure

```text
src/
  app/          App.tsx (router), routes.tsx
  components/   ApiKeyPanel, Header, Footer, BrandLogo, WheelGraphic, FoodRoulette, FilterPanel,
                LocationPanel, PlaceCard, PlaceLinks, PriceEstimate, SelectedPlaceCard,
                FoodMap, StatusStates
  config/       mapConfig.ts (all endpoints & constants), cityCentres.ts
  hooks/        useApiKey.ts, useGeolocation.ts, useNearbyPlaces.ts
  pages/        LandingPage.tsx, NearbyFoodPage.tsx
  services/     geoapifyService.ts
  types/        place.ts, geoapify.ts
  utils/        distance, filtering, budget, categories, normalise, random, mapLinks
  test/         *.test.ts(x)
```

To switch to a different place provider, write a new service that returns `Place[]` and swap it in `useNearbyPlaces.ts`. No UI changes are needed.

## How the place search works

1. Call `GET https://api.geoapify.com/v2/places` with:
   - `filter=circle:lon,lat,radius`
   - `bias=proximity:lon,lat`, so the nearest places come first
   - the food category keys
   - `limit=200`
2. Normalise each GeoJSON feature into a `Place`:
   - Features without a name or valid coordinates are skipped.
   - Cuisine, opening hours, website and phone are read from the provider fields when present, and are never invented.
3. Deduplicate by `place_id`, compute Haversine distance, drop anything outside the radius, and sort nearest first.
4. Save the result in the browser (see *Saved searches*).
   - Choosing a smaller radius re-filters locally.
   - Choosing a larger radius shows a **Search N km** button.

### Saved searches (browser cache)

Implemented in `src/services/placesCache.ts`.

- **What's saved:** place results, in `localStorage`, keyed by a search centre rounded to 3 decimals (~110 m) plus the radius. The precise location fix is never stored.
- **When it's reused:** a new search reuses a saved one when its centre is within 150 m and the radius is the same. A saved search with a larger radius is also reused if it wasn't cut off at the 200-result limit; it's filtered down locally. Distances are recomputed from your new position.
- **Filters:** category, budget and the unknown-price toggle never trigger a request, because they always run locally.
- **Limits:** saved searches expire after 24 hours, and at most 8 are kept.
- **Refreshing and clearing:** the page shows "Saved results … no credits used", with **Refresh** to force a new request and **Forget saved searches** to clear them. **Search again** always fetches fresh data.
- **Edge case:** if you've moved up to 150 m, a few places at the far edge of the circle may be missing until you refresh.

**Reliability:**

- Requests time out after 20 seconds (`AbortController`).
- There are no automatic retries. The user retries with a button.
- A rejected key (401/403) or an exhausted quota (429) shows an **Update API key** action.

## Privacy

- Location is requested only after a click.
- The precise location fix lives in React state only. It never goes into `localStorage`, cookies or the page URL. Saved searches store only a rounded (~110 m) search centre with the results, for up to 24 hours, and can be cleared from the page.
- Coordinates are sent only to Geoapify to search. The map tiles you view are also loaded from Geoapify.
- The API key, if a visitor enters one, stays in that browser's `localStorage`.
- There is no analytics or tracking.
- Price estimates you type are kept in memory for the current page session only.

## Data limitations (please read)

Geoapify's place data comes from OpenStreetMap, a community-maintained map. Coverage varies a lot by area.

- **Prices:**
  - The data almost never includes per-person meal prices, so every place shows **"Price unknown"** unless *you* add an estimate (labelled "your estimate").
  - Budget filters only use those estimates. Prices are never inferred from a place's name, cuisine or category.
  - If you pick a budget and exclude unknown prices, most places will usually disappear. The app explains this and offers to include them.
- **Opening hours** are shown as raw provider text with a "may be outdated" note. The app does **not** claim "open now".
- **No ratings, reviews or photos** are shown, because the data source doesn't have them.
- **Distances** are approximate straight-line distances, not walking or driving routes.
- **Location accuracy** depends on your device and browser. Desktop browsers may only estimate it from Wi-Fi or IP address.
- **Coverage:** each search returns at most the 200 nearest places, and the app doesn't claim to list every restaurant.

## Attribution

Geoapify's free plan requires attribution. The app shows "Powered by Geoapify" and "© OpenStreetMap contributors" in the footer, and the map tiles credit Geoapify, OpenMapTiles and OpenStreetMap. Keep these if you fork the project. Check the [Geoapify terms](https://www.geoapify.com/terms-and-conditions/) for current requirements.

## Deployment (free static hosting)

Run `npm run build` and deploy the `dist/` folder. If you build with `VITE_GEOAPIFY_API_KEY` set, that key is included in the site. If you leave it unset, visitors are asked for their own key.

Because `/nearby` is a client-side route, the host must serve `index.html` for unknown paths:

- **Cloudflare Pages / Netlify:** `public/_redirects` (`/* /index.html 200`) is already included. Use build command `npm run build` and output directory `dist`. Set `VITE_GEOAPIFY_API_KEY` in the project's environment variables if you want a built-in key.
- **Vercel:** `vercel.json` with an SPA rewrite is already included. Use the "Vite" framework preset.
- **GitHub Pages:**
  - GitHub Pages has no rewrites, so copy `dist/index.html` to `dist/404.html` after building.
  - If you deploy to `https://<user>.github.io/<repo>/`, build with `npx vite build --base=/<repo>/`. The router picks up the base path automatically.

After deploying, add your site's origin to the key's allowed origins in Geoapify. Then open the HTTPS URL, allow location, and check that a search returns results.

## Troubleshooting

| Problem | What to do |
|---|---|
| "Your Geoapify API key was rejected" | Check the key, and check that your site's origin (or `localhost:5173`) is allowed in the Geoapify project settings. Then use **Update API key**. |
| "Daily free quota … used up" | Wait for the daily reset, or use another key. |
| "Location access was blocked" | Click the lock or site-settings icon next to the address bar, set Location to *Allow*, then press **Try again**. Or pick a city centre. |
| Location times out | Turn on your device's location services. On desktop, try again or pick a city centre. |
| No results | Try a bigger radius. Some areas have little map data. You can [add places to OpenStreetMap](https://www.openstreetmap.org/) yourself! |
| `/nearby` gives a 404 after refresh | Your host needs the SPA rewrite described above. |

## Known limitations

- Each visitor needs a Geoapify key, unless the deployer provides one.
- A key built in at deploy time is visible in the site's JavaScript. Protect it by restricting its origin in Geoapify.
- Budget filtering is only as good as the estimates you enter. There is no shared price data.
- There is no reliable "open now" status.
- The wheel shows at most 12 places at a time, and a search returns at most 200 places.
- The manual fallback is a fixed list of city centres. There's no address search.
