// Pure filter/URL helpers for the cars listing page — no React, fully testable.
import { DEFAULT_PER_PAGE } from "@/lib/constants/car-options";

export const MULTI_KEYS = ["make", "bodyType", "fuelType", "transmission"];

export const DEFAULT_FILTERS = {
  search: undefined,
  make: [],
  bodyType: [],
  fuelType: [],
  transmission: [],
  dealership: undefined,
  city: undefined,
  color: undefined,
  minSeats: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  minYear: undefined,
  maxYear: undefined,
  minMileage: undefined,
  maxMileage: undefined,
  sortBy: "newest",
};

const num = (v) => (v !== null && v !== undefined && v !== "" ? Number(v) : undefined);

/** Parse a `?query=string` (with or without leading ?) into a filters object + page/perPage. */
export function parseFiltersFromSearch(search) {
  const p = new URLSearchParams(search);
  const csv = (key) => {
    const raw = p.get(key);
    return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  };

  return {
    filters: {
      search: p.get("search") || undefined,
      make: csv("make"),
      bodyType: csv("bodyType"),
      fuelType: csv("fuelType"),
      transmission: csv("transmission"),
      dealership: p.get("dealership") || undefined,
      city: p.get("city") || undefined,
      color: p.get("color") || undefined,
      minSeats: num(p.get("minSeats")),
      minPrice: num(p.get("minPrice")),
      maxPrice: num(p.get("maxPrice")),
      minYear: num(p.get("minYear")),
      maxYear: num(p.get("maxYear")),
      minMileage: num(p.get("minMileage")),
      maxMileage: num(p.get("maxMileage")),
      sortBy: p.get("sortBy") || "newest",
    },
    page: num(p.get("page")) || 1,
    perPage: num(p.get("perPage")) || DEFAULT_PER_PAGE,
  };
}

/** Serialize filters + page/perPage back into a `/cars?...` URL. */
export function buildCarsUrl(filters, page, perPage) {
  const params = new URLSearchParams();

  if (filters.search) params.set("search", filters.search);
  MULTI_KEYS.forEach((key) => {
    if (filters[key]?.length) params.set(key, filters[key].join(","));
  });
  if (filters.dealership) params.set("dealership", filters.dealership);
  if (filters.city) params.set("city", filters.city);
  if (filters.color) params.set("color", filters.color);
  if (filters.minSeats) params.set("minSeats", String(filters.minSeats));
  if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.minYear) params.set("minYear", String(filters.minYear));
  if (filters.maxYear) params.set("maxYear", String(filters.maxYear));
  if (filters.minMileage) params.set("minMileage", String(filters.minMileage));
  if (filters.maxMileage) params.set("maxMileage", String(filters.maxMileage));
  if (filters.sortBy && filters.sortBy !== "newest") params.set("sortBy", filters.sortBy);
  if (perPage && perPage !== DEFAULT_PER_PAGE) params.set("perPage", String(perPage));
  if (page > 1) params.set("page", String(page));

  const qs = params.toString();
  return qs ? `/cars?${qs}` : "/cars";
}

/** Build the active-filter chip list shown above the results grid. */
export function buildActiveFilterChips(filters) {
  const chips = [];
  if (filters.search) chips.push({ type: "search", value: filters.search, label: `“${filters.search}”` });
  MULTI_KEYS.forEach((key) => {
    (filters[key] || []).forEach((v) => chips.push({ type: key, value: v, label: v }));
  });
  if (filters.dealership) chips.push({ type: "dealership", value: filters.dealership, label: filters.dealership });
  if (filters.city) chips.push({ type: "city", value: filters.city, label: filters.city });
  if (filters.color) chips.push({ type: "color", value: filters.color, label: filters.color });
  if (filters.minSeats) chips.push({ type: "minSeats", value: String(filters.minSeats), label: `${filters.minSeats}+ seats` });
  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice ? `$${filters.minPrice.toLocaleString()}` : "$0";
    const max = filters.maxPrice ? `$${filters.maxPrice.toLocaleString()}` : "Any";
    chips.push({ type: "price", value: "price", label: `${min} – ${max}` });
  }
  if (filters.minYear || filters.maxYear) {
    chips.push({ type: "year", value: "year", label: `${filters.minYear || "Any"} – ${filters.maxYear || "Any"}` });
  }
  if (filters.minMileage || filters.maxMileage) {
    const max = filters.maxMileage ? `${filters.maxMileage.toLocaleString()} mi` : "Any";
    chips.push({ type: "mileage", value: "mileage", label: `≤ ${max}` });
  }
  return chips;
}
