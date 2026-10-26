import type { BudgetFilter } from "../types/place";

export const BUDGET_OPTIONS: { value: BudgetFilter; label: string; min: number; max: number }[] = [
  { value: "any", label: "Any budget", min: 0, max: Infinity },
  { value: "under_10", label: "Under RM10", min: 0, max: 10 },
  { value: "10_20", label: "RM10–RM20", min: 10, max: 20 },
  { value: "20_35", label: "RM20–RM35", min: 20, max: 35 },
  { value: "35_50", label: "RM35–RM50", min: 35, max: 50 },
  { value: "over_50", label: "Over RM50", min: 50, max: Infinity },
];

/** Lower bound inclusive, upper bound exclusive (so RM20 falls in RM20–RM35). */
export function priceMatchesBudget(priceRm: number, budget: BudgetFilter): boolean {
  const opt = BUDGET_OPTIONS.find((o) => o.value === budget);
  if (!opt) return true;
  return priceRm >= opt.min && priceRm < opt.max;
}

export function formatPrice(priceRm: number | undefined): string {
  if (priceRm === undefined) return "Price unknown";
  return `~RM${Number.isInteger(priceRm) ? priceRm : priceRm.toFixed(2)} / person`;
}
