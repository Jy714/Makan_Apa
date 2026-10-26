import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { routes } from "../app/routes";

const KEY_STORAGE = "makan-apa:geoapify-key";

function renderAt(path: string, state?: unknown) {
  const router = createMemoryRouter(routes, { initialEntries: [{ pathname: path, state }] });
  render(<RouterProvider router={router} />);
  return router;
}

let getCurrentPosition: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  getCurrentPosition = vi.fn();
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition },
  });
});

describe("with an API key saved", () => {
  beforeEach(() => localStorage.setItem(KEY_STORAGE, "test-key"));

  it("renders the landing page without requesting location", () => {
    renderAt("/");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Makan Apa Today?");
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it("the CTA navigates to /nearby and starts the location flow", () => {
    const router = renderAt("/");
    fireEvent.click(screen.getAllByRole("link", { name: /find food near me/i })[0]);
    expect(router.state.location.pathname).toBe("/nearby");
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /getting your location/i })).toBeDisabled();
  });

  it("opening /nearby directly shows a location button and does not auto-request", () => {
    renderAt("/nearby");
    expect(getCurrentPosition).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /use my location/i }));
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it("shows a helpful message and retry when permission is denied", () => {
    getCurrentPosition.mockImplementation((_ok: unknown, fail: (e: { code: number }) => void) => fail({ code: 1 }));
    renderAt("/nearby");
    fireEvent.click(screen.getByRole("button", { name: /use my location/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/location access was blocked/i);
    expect(screen.getByRole("button", { name: /try again/i })).toBeEnabled();
  });
});

describe("without an API key", () => {
  it("asks for a key instead of requesting location, then continues the CTA intent once saved", () => {
    renderAt("/nearby", { startLocation: true });
    expect(screen.getByRole("heading", { name: /add your free geoapify key/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /use my location/i })).not.toBeInTheDocument();
    expect(getCurrentPosition).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/geoapify api key/i), { target: { value: "  my-key  " } });
    fireEvent.click(screen.getByRole("button", { name: /save key/i }));

    expect(localStorage.getItem(KEY_STORAGE)).toBe("my-key");
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });
});
