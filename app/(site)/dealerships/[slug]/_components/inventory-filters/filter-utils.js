// Pure helpers for the dealership inventory filter bar.

export const formatPrice = (price) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);

/**
 * Build the active-filter chip descriptors from the current filters.
 */
export function buildActiveChips(filters, availableFilters) {
  const chips = [];
  if (filters.search) {
    chips.push({ type: "search", label: `Search: "${filters.search}"`, field: "search" });
  }
  if (filters.minPrice || filters.maxPrice) {
    const minStr = filters.minPrice ? formatPrice(filters.minPrice) : "$0";
    const maxStr = filters.maxPrice
      ? formatPrice(filters.maxPrice)
      : formatPrice(availableFilters?.priceRange?.max || 100000);
    chips.push({ type: "price", label: `Price: ${minStr} - ${maxStr}`, field: "price" });
  }
  ["bodyType", "fuelType", "transmission"].forEach((field) => {
    if (filters[field]) {
      filters[field].split(",").forEach((val) => {
        chips.push({ type: field, label: val, field, value: val });
      });
    }
  });
  return chips;
}
