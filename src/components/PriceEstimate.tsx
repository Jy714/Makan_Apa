import { useId, useState } from "react";
import { formatPrice } from "../utils/budget";

type Props = {
  estimate: number | undefined;
  onChange: (value: number | undefined) => void;
};

/** Shows "Price unknown" or the user's own session-only estimate, with a tiny inline editor. */
export function PriceEstimate({ estimate, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(estimate?.toString() ?? "");
  const inputId = useId();

  if (editing) {
    return (
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const value = Number(draft);
          onChange(draft.trim() === "" || !Number.isFinite(value) || value < 0 ? undefined : value);
          setEditing(false);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Your estimated price per person in RM
        </label>
        <span className="text-xs font-semibold text-muted">RM</span>
        <input
          id={inputId}
          type="number"
          inputMode="decimal"
          min={0}
          max={1000}
          step="0.5"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-9 w-20 rounded-lg border border-line px-2 text-sm"
        />
        <button type="submit" className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
          Save
        </button>
        <button type="button" className="text-xs font-semibold text-muted underline" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </form>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className={estimate === undefined ? "text-muted" : "font-medium text-ink"}>
        {formatPrice(estimate)}
        {estimate !== undefined && <span className="ml-1 text-xs text-muted">(your estimate)</span>}
      </span>
      <button
        type="button"
        className="text-xs font-semibold text-tomato underline underline-offset-2 hover:text-tomato-hover"
        onClick={() => {
          setDraft(estimate?.toString() ?? "");
          setEditing(true);
        }}
      >
        {estimate === undefined ? "Add your estimate" : "Edit"}
      </button>
    </span>
  );
}
