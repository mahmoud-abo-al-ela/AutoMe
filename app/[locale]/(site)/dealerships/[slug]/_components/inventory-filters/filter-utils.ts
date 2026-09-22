// Pure helpers for the dealership inventory filter bar.
import type {
  ActiveFilterChip,
  DealershipCarFilterOptions,
  DealershipInventoryFilterState,
} from "../../_lib/detail-types";

/**
 * Everything `buildActiveChips` needs to render a label in the active locale.
 * Injected rather than imported so this module stays React-free and directly
 * testable — the same arrangement the car listing chips use.
 */
export interface InventoryChipFormatters {
  formatPrice: (value: number) => string;
  search: (query: string) => string;
  priceRange: (min: string, max: string) => string;
  /** Translates a stored attribute value (body/fuel/transmission). */
  attribute: (field: string, value: string) => string;
}

/**
 * Build the active-filter chip descriptors from the current filters.
 */
export function buildActiveChips(
  filters: DealershipInventoryFilterState,
  availableFilters: DealershipCarFilterOptions | null,
  fmt: InventoryChipFormatters
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.search) {
    chips.push({
      type: "search",
      label: fmt.search(filters.search),
      field: "search",
    });
  }

  if (filters.minPrice || filters.maxPrice) {
    // Was a literal "$0" — the one hardcoded dollar sign the currency sweep
    // missed, because it is a bare string rather than a template or an
    // Intl.NumberFormat call.
    const minStr = fmt.formatPrice(Number(filters.minPrice) || 0);
    const maxStr = fmt.formatPrice(
      Number(filters.maxPrice) || availableFilters?.priceRange?.max || 100000
    );
    chips.push({
      type: "price",
      label: fmt.priceRange(minStr, maxStr),
      field: "price",
    });
  }

  (["bodyType", "fuelType", "transmission"] as const).forEach((field) => {
    const value = filters[field];
    if (value) {
      // `value` stays the stored English so clearing the chip still matches the
      // filter; only the label is translated.
      value.split(",").forEach((val) => {
        chips.push({
          type: field,
          label: fmt.attribute(field, val),
          field,
          value: val,
        });
      });
    }
  });

  return chips;
}
