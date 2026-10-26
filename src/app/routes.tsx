import { Link, type RouteObject } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage";
import { NearbyFoodPage } from "../pages/NearbyFoodPage";

function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-3xl font-bold">Page not found</h1>
      <p className="text-muted">This page doesn't exist — but food nearby does.</p>
      <Link to="/" className="btn-primary">Back to Makan Apa</Link>
    </main>
  );
}

export const routes: RouteObject[] = [
  { path: "/", element: <LandingPage /> },
  { path: "/nearby", element: <NearbyFoodPage /> },
  { path: "*", element: <NotFound /> },
];
