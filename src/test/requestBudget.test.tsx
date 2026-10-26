import { act, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { routes } from "../app/routes";
import {
  allowRequest,
  MAX_REQUESTS_PER_WINDOW,
  REQUEST_WINDOW_MS,
  resetRequestBudget,
} from "../hooks/useNearbyPlaces";

// Leaflet needs a real layout engine; the map isn't what's under test here.
vi.mock("../components/FoodMap", () => ({ FoodMap: () => null }));

const feature = (id: string, lat: number, lon: number) => ({
  type: "Feature",
  properties: { place_id: id, name: `Place ${id}`, lat, lon, categories: ["catering.restaurant"] },
});

beforeEach(() => {
  resetRequestBudget();
  localStorage.clear();
  localStorage.setItem("makan-apa:geoapify-key", "test-key");
});
afterEach(() => vi.unstubAllGlobals());

describe("allowRequest (circuit breaker)", () => {
  it(`allows at most ${MAX_REQUESTS_PER_WINDOW} requests per window, then recovers`, () => {
    const t0 = 1_000_000;
    for (let i = 0; i < MAX_REQUESTS_PER_WINDOW; i++) expect(allowRequest(t0 + i)).toBe(true);
    expect(allowRequest(t0 + 100)).toBe(false);
    expect(allowRequest(t0 + REQUEST_WINDOW_MS + 10)).toBe(true);
  });
});

describe("location → search", () => {
  it("sends exactly one request per location fix (no render loop), even in StrictMode", async () => {
    const fetchMock = vi.fn().mockImplementation(
      async () => new Response(JSON.stringify({ features: [feature("a", 3.147, 101.7113), feature("b", 3.148, 101.7113)] }))
    );
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (ok: PositionCallback) =>
          ok({ coords: { latitude: 3.1466, longitude: 101.7113 } } as GeolocationPosition),
      },
    });

    const router = createMemoryRouter(routes, { initialEntries: [{ pathname: "/nearby", state: { startLocation: true } }] });
    render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>
    );

    expect(await screen.findByText(/Picking from 2 eligible places/i)).toBeInTheDocument();
    // Give any runaway effect loop plenty of chances to fire.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("saved searches", () => {
  it("a repeat search at the same spot is served from the browser cache with no request", async () => {
    const fetchMock = vi.fn().mockImplementation(
      async () => new Response(JSON.stringify({ features: [feature("a", 3.147, 101.7113)] }))
    );
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (ok: PositionCallback) =>
          ok({ coords: { latitude: 3.1466, longitude: 101.7113 } } as GeolocationPosition),
      },
    });

    const first = render(
      <RouterProvider router={createMemoryRouter(routes, { initialEntries: [{ pathname: "/nearby", state: { startLocation: true } }] })} />
    );
    expect(await screen.findByText(/Picking from 1 eligible place/i)).toBeInTheDocument();
    first.unmount();

    render(
      <RouterProvider router={createMemoryRouter(routes, { initialEntries: [{ pathname: "/nearby", state: { startLocation: true } }] })} />
    );
    expect(await screen.findByText(/no credits used/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
