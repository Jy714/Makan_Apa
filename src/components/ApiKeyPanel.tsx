import { ExternalLink, KeyRound, ShieldCheck } from "lucide-react";
import { useId, useState } from "react";
import { GEOAPIFY_SIGNUP_URL } from "../config/mapConfig";

type Props = {
  source: "user" | "deployment" | "none";
  onSave: (key: string) => void;
  onClear: () => void;
  onClose?: () => void;
  /** Shown when the current key was rejected. */
  problem?: string;
};

export function ApiKeyPanel({ source, onSave, onClear, onClose, problem }: Props) {
  const [draft, setDraft] = useState("");
  const inputId = useId();
  const hintId = useId();

  return (
    <section className="card mx-auto max-w-2xl p-6 sm:p-8" aria-labelledby="key-heading">
      <div className="flex items-start gap-4">
        <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-tomato-soft text-tomato sm:flex">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="key-heading" className="font-display text-2xl font-bold">
            {source === "none" ? "Add your free Geoapify key" : "Geoapify API key"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            Makan Apa is open source and has no server of its own. Place search runs on{" "}
            <strong className="text-ink">Geoapify</strong>, which gives everyone a free key —{" "}
            <strong className="text-ink">3,000 credits a day, no credit card</strong>. One search uses at most 10
            credits.
          </p>

          {problem && (
            <p role="alert" className="mt-3 rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
              {problem}
            </p>
          )}

          <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm">
            <li>
              Sign up at{" "}
              <a
                href={GEOAPIFY_SIGNUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-tomato underline underline-offset-2"
              >
                myprojects.geoapify.com
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>{" "}
              and create a project.
            </li>
            <li>Copy the project's API key and paste it below.</li>
          </ol>

          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) {
                onSave(draft);
                setDraft("");
              }
            }}
          >
            <label htmlFor={inputId} className="sr-only">
              Geoapify API key
            </label>
            <input
              id={inputId}
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder={source === "none" ? "Paste your API key" : "Paste a new API key"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-describedby={hintId}
              className="min-h-[44px] w-full rounded-xl border border-line bg-surface px-3 text-sm"
            />
            <button type="submit" className="btn-primary shrink-0" disabled={!draft.trim()}>
              Save key
            </button>
          </form>

          <p id={hintId} className="mt-3 flex items-start gap-2 text-xs text-muted">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            Your key is stored only in this browser and is sent only to Geoapify. For extra safety, restrict the key to
            this website's address in your Geoapify project settings.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            {source === "user" && <span className="text-muted">Using the key you saved in this browser.</span>}
            {source === "deployment" && <span className="text-muted">Using the key provided by this website.</span>}
            {source === "user" && (
              <button type="button" className="btn-ghost px-3 py-2 text-danger" onClick={onClear}>
                Remove my key
              </button>
            )}
            {onClose && source !== "none" && (
              <button type="button" className="btn-secondary px-4 py-2" onClick={onClose}>
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
