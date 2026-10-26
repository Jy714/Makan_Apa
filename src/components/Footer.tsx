import { Github } from "lucide-react";
import { AUTHOR_GITHUB_URL, GEOAPIFY_URL, OSM_COPYRIGHT_URL } from "../config/mapConfig";
import { LogoMark } from "./BrandLogo";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface/60">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted sm:px-6 md:grid-cols-[1fr_auto] md:items-end">
        <div className="max-w-md space-y-3">
          <div className="flex items-center gap-2 text-ink">
            <LogoMark className="h-7 w-7" />
            <span className="font-display text-lg font-bold">Makan Apa</span>
          </div>
          <p>
            Find food nearby. Let the wheel decide. Free and open source — no sign-up, no ads, no tracking.
          </p>
          <p>
            Place information, prices and opening hours come from community data and may be incomplete
            or out of date. Distances are approximate straight-line distances.
          </p>
        </div>
        <p className="md:text-right">
          Powered by{" "}
          <a href={GEOAPIFY_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline underline-offset-2">
            Geoapify
          </a>
          <br />
          Place data ©{" "}
          <a
            href={OSM_COPYRIGHT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ink underline underline-offset-2"
          >
            OpenStreetMap contributors
          </a>
        </p>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Makan Apa</p>
          <a
            href={AUTHOR_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-medium text-ink hover:text-tomato"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
            github.com/Jy714
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
