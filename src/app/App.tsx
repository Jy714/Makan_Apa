import { useEffect } from "react";
import { createBrowserRouter, RouterProvider, useLocation, useRoutes } from "react-router-dom";
import { routes } from "./routes";

const TITLES: Record<string, string> = {
  "/": "Makan Apa — Find food nearby. Let the wheel decide.",
  "/nearby": "Your Nearby Food Picks · Makan Apa",
};

function Shell() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = TITLES[pathname] ?? "Makan Apa";
    // Jump (not smooth-scroll) to the top when changing pages.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return useRoutes(routes);
}

const router = createBrowserRouter([{ path: "*", element: <Shell /> }], {
  basename: import.meta.env.BASE_URL.replace(/\/$/, "") || "/",
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

export function App() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}
