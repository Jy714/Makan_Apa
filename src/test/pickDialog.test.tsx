import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { StrictMode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { routes } from "../app/routes";
import { resetRequestBudget } from "../hooks/useNearbyPlaces";

// Leaflet needs a real layout engine; maps aren't under test here.
vi.mock("../components/FoodMap", () => ({ FoodMap: () => null, PlaceMiniMap: () => <div data-testid="mini-map" /> }));

beforeEach(() => {
  resetRequestBudget();
  localStorage.clear();
  localStorage.setItem("makan-apa:geoapify-key", "test-key");
  // Reduced motion → the wheel lands immediately.
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), addEventListener() {}, removeEventListener() {} }));
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            features: [
              {
                properties: {
                  place_id: "only",
                  name: "Nasi Lemak Antarabangsa",
                  lat: 3.1476,
                  lon: 101.7113,
                  categories: ["catering.restaurant.malaysian"],
                  housenumber: "1",
                  street: "Jalan Contoh",
                },
              },
            ],
          })
        )
    )
  );
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: (ok: PositionCallback) =>
        ok({ coords: { latitude: 3.1466, longitude: 101.7113 } } as GeolocationPosition),
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

it("opens a dialog showing where the spun place is, and it can be closed", async () => {
  const router = createMemoryRouter(routes, { initialEntries: [{ pathname: "/nearby", state: { startLocation: true } }] });
  // StrictMode matches the dev build, where effects run twice.
  render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );

  fireEvent.click(await screen.findByRole("button", { name: /spin the wheel/i }));

  // Wait with a cheap query first; role queries over the whole page are slow in jsdom.
  await waitFor(() => expect(document.querySelector("dialog[open]")).not.toBeNull(), { timeout: 3000 });
  const dialog = screen.getByRole("dialog", { name: "Nasi Lemak Antarabangsa" });
  expect(within(dialog).getByText(/today's pick/i)).toBeInTheDocument();
  expect(within(dialog).getByText("1 Jalan Contoh")).toBeInTheDocument();
  expect(within(dialog).getByText("Price unknown")).toBeInTheDocument();
  expect(within(dialog).getByRole("link", { name: /get directions/i })).toHaveAttribute(
    "href",
    "https://www.google.com/maps/dir/?api=1&destination=3.147600,101.711300"
  );
  expect(await within(dialog).findByTestId("mini-map")).toBeInTheDocument();

  fireEvent.click(within(dialog).getByRole("button", { name: /^close$/i }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
