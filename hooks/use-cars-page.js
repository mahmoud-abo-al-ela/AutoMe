"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { getCars, getCarsFilters } from "@/actions/cars-listing";
import { DEFAULT_PER_PAGE } from "@/lib/constants/car-options";

export { DEFAULT_PER_PAGE };

const MULTI_KEYS = ["make", "bodyType", "fuelType", "transmission"];

const DEFAULT_FILTERS = {
  search: undefined,
  make: [],
  bodyType: [],
  fuelType: [],
  transmission: [],
  dealership: undefined,
  city: undefined,
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

export const useCarsPage = (initialData = null, initialState = null) => {
  // Prefer the server-parsed state (identical on server and client → no
  // hydration mismatch); fall back to parsing the URL on the client only.
  const initial =
    initialState || parseFiltersFromSearch(typeof window !== "undefined" ? window.location.search : "");

  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initial.filters });
  const [page, setPage] = useState(initial.page || 1);
  const [perPage, setPerPage] = useState(initial.perPage || DEFAULT_PER_PAGE);
  // Responsive search field, decoupled from the (debounced) committed filter.
  const [searchInput, setSearchInput] = useState(initial.filters?.search || "");

  // True while a page/perPage change is fetching, so the UI can show skeletons
  // for the new page instead of dimming the previous page in place.
  const [isPaging, setIsPaging] = useState(false);

  // Only seed react-query with SSR data while the key still matches the server's.
  const isInitialKeyRef = useRef(true);
  const searchDebounceRef = useRef(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const listKey = queryKeys.cars.list({ ...filters, page, perPage });

  const {
    data: queryData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: listKey,
    queryFn: () => getCars({ ...filters, page, limit: perPage }),
    placeholderData: keepPreviousData,
    initialData: isInitialKeyRef.current ? initialData : undefined,
  });

  // Cross-filtered facet options, shared by every filter panel instance.
  const { data: optionsData, isLoading: optionsLoading } = useQuery({
    queryKey: queryKeys.cars.filters(filters),
    queryFn: () => getCarsFilters(filters),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    isInitialKeyRef.current = false;
  }, [filters, page, perPage]);

  // Clear the paging flag once the new page has finished loading.
  useEffect(() => {
    if (!isFetching) setIsPaging(false);
  }, [isFetching]);

  // Back/forward: our URL writes bypass the router, so re-read on popstate.
  useEffect(() => {
    const onPop = () => {
      const parsed = parseFiltersFromSearch(window.location.search);
      setFilters(parsed.filters);
      setPage(parsed.page);
      setPerPage(parsed.perPage);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const pushUrl = useCallback((nextFilters, nextPage, nextPerPage, replace = false) => {
    const url = buildCarsUrl(nextFilters, nextPage, nextPerPage);
    if (replace) {
      window.history.replaceState(null, "", url);
    } else {
      window.history.pushState(null, "", url);
    }
  }, []);

  const scrollToResults = useCallback(() => {
    if (typeof window === "undefined") return;
    // Defer to after the page-change render commits so the scroll isn't
    // interrupted by layout work, and land just below the fixed header at the
    // top of the results (summary + first card row).
    requestAnimationFrame(() => {
      const section = document.getElementById("cars-results-section");
      if (!section) return;
      const HEADER_OFFSET = 80;
      const top = section.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
  }, []);

  // Apply a whole filters object (resets to page 1). Discrete → pushState.
  const applyFilters = useCallback(
    (nextFilters, { replace = false } = {}) => {
      setFilters(nextFilters);
      setPage(1);
      pushUrl(nextFilters, 1, perPage, replace);
    },
    [perPage, pushUrl]
  );

  // Set a single field and apply.
  const setFilter = useCallback(
    (key, value) => applyFilters({ ...filters, [key]: value }),
    [filters, applyFilters]
  );

  // Merge a partial filters patch (used by hero quick-picks) and apply.
  const applyPatch = useCallback(
    (patch) => applyFilters({ ...filters, ...patch }),
    [filters, applyFilters]
  );

  // Toggle one value in a multi-select array field.
  const toggleMulti = useCallback(
    (key, value) => {
      const current = filters[key] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      applyFilters({ ...filters, [key]: next });
    },
    [filters, applyFilters]
  );

  // Search-as-you-type: the input updates immediately; the committed filter
  // (which drives the fetch + URL) is debounced so we don't query per keystroke
  // or flood the back stack.
  const setSearch = useCallback(
    (value) => {
      setSearchInput(value);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        const next = { ...filtersRef.current, search: value || undefined };
        setFilters(next);
        setPage(1);
        pushUrl(next, 1, perPage, true);
      }, 400);
    },
    [perPage, pushUrl]
  );

  // Keep the field in sync when search changes from elsewhere (chip clear,
  // reset, quick-pick, back/forward).
  useEffect(() => {
    setSearchInput(filters.search || "");
  }, [filters.search]);

  const setSort = useCallback(
    (sortBy) => {
      const next = { ...filters, sortBy };
      setFilters(next);
      pushUrl(next, page, perPage);
    },
    [filters, page, perPage, pushUrl]
  );

  const changePage = useCallback(
    (nextPage) => {
      setIsPaging(true);
      setPage(nextPage);
      pushUrl(filters, nextPage, perPage);
      scrollToResults();
    },
    [filters, perPage, pushUrl, scrollToResults]
  );

  const changePerPage = useCallback(
    (nextPerPage) => {
      setIsPaging(true);
      setPerPage(nextPerPage);
      setPage(1);
      pushUrl(filters, 1, nextPerPage);
    },
    [filters, pushUrl]
  );

  // Commit a [min, max] range for price/year/mileage. Values equal to the
  // domain bounds are dropped so we don't pin the URL to the full range.
  const commitRange = useCallback(
    (minKey, maxKey, [min, max], bounds) => {
      const next = {
        ...filters,
        [minKey]: bounds && min <= bounds.min ? undefined : min || undefined,
        [maxKey]: bounds && max >= bounds.max ? undefined : max || undefined,
      };
      applyFilters(next);
    },
    [filters, applyFilters]
  );

  const resetAllFilters = useCallback(() => {
    const reset = { ...DEFAULT_FILTERS };
    setFilters(reset);
    setPage(1);
    pushUrl(reset, 1, perPage);
  }, [perPage, pushUrl]);

  // Clear one active-filter chip. For multi fields, `value` removes a single entry.
  const clearFilter = useCallback(
    (type, value) => {
      const next = { ...filters };
      switch (type) {
        case "search":
          next.search = undefined;
          break;
        case "make":
        case "bodyType":
        case "fuelType":
        case "transmission":
          next[type] = value ? (filters[type] || []).filter((v) => v !== value) : [];
          break;
        case "dealership":
          next.dealership = undefined;
          break;
        case "city":
          next.city = undefined;
          break;
        case "price":
          next.minPrice = undefined;
          next.maxPrice = undefined;
          break;
        case "year":
          next.minYear = undefined;
          next.maxYear = undefined;
          break;
        case "mileage":
          next.minMileage = undefined;
          next.maxMileage = undefined;
          break;
        case "all":
          resetAllFilters();
          return;
        default:
          break;
      }
      applyFilters(next);
    },
    [filters, applyFilters, resetAllFilters]
  );

  const getActiveFilters = useCallback(() => {
    const chips = [];
    if (filters.search) chips.push({ type: "search", value: filters.search, label: `“${filters.search}”` });
    MULTI_KEYS.forEach((key) => {
      (filters[key] || []).forEach((v) => chips.push({ type: key, value: v, label: v }));
    });
    if (filters.dealership) chips.push({ type: "dealership", value: filters.dealership, label: filters.dealership });
    if (filters.city) chips.push({ type: "city", value: filters.city, label: filters.city });
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
  }, [filters]);

  const isError = !!error || (queryData && queryData.success === false);

  return {
    cars: queryData?.success ? queryData.data.cars : [],
    pagination: queryData?.success
      ? queryData.data.pagination
      : { total: 0, page, limit: perPage, totalPages: 0 },
    // First-load only; subsequent fetches keep previous data mounted.
    loading: isLoading,
    isFetching,
    isPaging,
    isError,
    errorMessage: queryData?.error?.message,
    refetch,
    filters,
    searchValue: searchInput,
    perPage,
    filterOptions: optionsData?.success ? optionsData.data : null,
    optionsLoading,
    activeFilters: getActiveFilters(),
    handlers: {
      setFilter,
      applyPatch,
      toggleMulti,
      commitRange,
      setSearch,
      setSort,
      changePage,
      changePerPage,
      clearFilter,
      resetAllFilters,
    },
  };
};
