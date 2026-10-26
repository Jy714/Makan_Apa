import { RotateCcw, Search } from "lucide-react";
import { RADIUS_OPTIONS } from "../config/mapConfig";
import type { BudgetFilter, CategoryFilter, Filters } from "../types/place";
import { BUDGET_OPTIONS } from "../utils/budget";
import { CATEGORY_FILTER_OPTIONS } from "../utils/categories";
import { formatRadius } from "../utils/distance";

type Props = {
  filters: Filters;
  onChange: (next: Filters) => void;
  onClear: () => void;
  disabled: boolean;
  /** Set when the chosen radius is larger than what was fetched, so a new search is needed. */
  needsWiderSearch: boolean;
  onWiderSearch: () => void;
};

export function FilterPanel({ filters, onChange, onClear, disabled, needsWiderSearch, onWiderSearch }: Props) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => onChange({ ...filters, [key]: value });

  return (
    <section aria-label="Filters" className="card p-4 sm:p-5">
      <fieldset disabled={disabled} className="grid grid-cols-2 gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))_auto] md:items-end">
        <div>
          <label htmlFor="f-radius" className="field-label">
            Distance
          </label>
          <select
            id="f-radius"
            className="select"
            value={filters.radiusMeters}
            onChange={(e) => set("radiusMeters", Number(e.target.value))}
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                Within {formatRadius(r)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-category" className="field-label">
            Food type
          </label>
          <select
            id="f-category"
            className="select"
            value={filters.category}
            onChange={(e) => set("category", e.target.value as CategoryFilter)}
          >
            {CATEGORY_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="f-budget" className="field-label">
            Budget per person
          </label>
          <select
            id="f-budget"
            className="select"
            value={filters.budget}
            onChange={(e) => set("budget", e.target.value as BudgetFilter)}
          >
            {BUDGET_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={onClear} className="btn-ghost col-span-2 md:col-span-1">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Clear filters
        </button>

        <label className="col-span-2 flex cursor-pointer items-start gap-3 rounded-xl bg-cream px-3 py-2.5 text-sm md:col-span-4">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 accent-tomato"
            checked={filters.includeUnknownPrices}
            onChange={(e) => set("includeUnknownPrices", e.target.checked)}
          />
          <span>
            <span className="font-semibold">Include places with unknown prices</span>
            <span className="block text-muted">
              Most places in the map data don't list prices. Budget filtering only uses estimates you add yourself.
            </span>
          </span>
        </label>
      </fieldset>

      {needsWiderSearch && (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-saffron/60 bg-saffron/10 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>Results so far only cover a smaller area. Search again to include places up to {formatRadius(filters.radiusMeters)} away.</p>
          <button type="button" className="btn-primary shrink-0 py-2" onClick={onWiderSearch} disabled={disabled}>
            <Search className="h-4 w-4" aria-hidden="true" />
            Search {formatRadius(filters.radiusMeters)}
          </button>
        </div>
      )}
    </section>
  );
}
