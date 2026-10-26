/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional Geoapify key baked in at build time. Visitors can also enter their own key in the app. */
  readonly VITE_GEOAPIFY_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
