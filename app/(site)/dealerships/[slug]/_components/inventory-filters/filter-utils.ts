// Pure helpers for the dealership inventory filter bar.
import { formatCarPrice } from "@/lib/utils/currency";
import type {
  ActiveFilterChip,
  DealershipCarFilterOptions,
  DealershipInventoryFilterState,
} from "../../_lib/detail-types";

export const formatPrice = (price: number) => formatCarPrice(price);

/**
 * Build the active-filter chip descriptors from the current filters.
 */
export function buildActiveChips(
  filters: DealershipInventoryFilterState,
  availableFilters: DealershipCarFilterOptions | null
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  if (filters.search) {
    chips.push({ type: "search", label: `Search: "${filters.search}"`, field: "search" });
  }
  if (filters.minPrice || filters.maxPrice) {
    // Was a literal "$0" — the one hardcoded dollar sign the currency sweep
    // missed, because it is a bare string rather than a template or an
    // Intl.NumberFormat call.
    const minStr = filters.minPrice ? formatPrice(Number(filters.minPrice)) : formatPrice(0);
    const maxStr = filters.maxPrice
      ? formatPrice(Number(filters.maxPrice))
      : formatPrice(availableFilters?.priceRange?.max || 100000);
    chips.push({ type: "price", label: `Price: ${minStr} - ${maxStr}`, field: "price" });
  }
  (["bodyType", "fuelType", "transmission"] as const).forEach((field) => {
    const value = filters[field];
    if (value) {
      value.split(",").forEach((val) => {
        chips.push({ type: field, label: val, field, value: val });
      });
    }
  });
  return chips;
}
