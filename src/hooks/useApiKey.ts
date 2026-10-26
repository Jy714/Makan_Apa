import { useCallback, useState } from "react";

const STORAGE_KEY = "makan-apa:geoapify-key";

/** Key baked in by whoever deploys the site (optional). Geoapify keys are meant for browser use; restrict them by origin. */
export const DEPLOYMENT_KEY = (import.meta.env.VITE_GEOAPIFY_API_KEY ?? "").trim();

function readStoredKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

/**
 * A key the visitor pastes in is kept only in their own browser's localStorage and is sent only to Geoapify.
 * A visitor key takes precedence over the deployment key.
 */
export function useApiKey() {
  const [userKey, setUserKey] = useState(readStoredKey);

  const save = useCallback((key: string) => {
    const trimmed = key.trim();
    setUserKey(trimmed);
    try {
      if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable (private mode etc.): the key still works for this page session.
    }
  }, []);

  const clear = useCallback(() => save(""), [save]);

  return {
    apiKey: userKey || DEPLOYMENT_KEY,
    source: userKey ? ("user" as const) : DEPLOYMENT_KEY ? ("deployment" as const) : ("none" as const),
    save,
    clear,
  };
}
