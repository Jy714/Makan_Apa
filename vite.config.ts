/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // The map is lazy-loaded; pre-bundle its deps so the dev server doesn't reload mid-session.
  optimizeDeps: { include: ["leaflet", "react-leaflet"] },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Tests must never see (or spend) a real key from .env.local.
    env: { VITE_GEOAPIFY_API_KEY: "" },
  },
});
