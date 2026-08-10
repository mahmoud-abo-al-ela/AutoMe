"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { getCars, getCarsFilters } from "@/actions/cars-listing";
import { DEFAULT_PER_PAGE } from "@/lib/constants/car-options";
import {
  DEFAULT_FILTERS,
  parseFiltersFromSearch,
  buildCarsUrl,
  buildActiveFilterChips,
} from "./cars-page-filters";
import type { CarPageFilters, MultiKey } from "./cars-page-filters";
import type { ActionResponse } from "@/lib/utils/response";

// Re-exported for backward-compatible import sites.
export { DEFAULT_PER_PAGE, parseFiltersFromSearch, buildCarsUrl };

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

  // True while a search or filter change is fetching. These produce a different
  // result set (not a slice of the same one), so — like paging — we show skeletons
  // rather than dimming stale results the user is no longer looking for. Sort is
  // excluded: it reorders the same set, so dimming reads better there.
  const [isFilterPending, setIsFilterPending] = useState(false);

  // Only seed react-query with SSR data while the key still matches the server's.
  const isInitialKeyRef = useRef(true);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Clear the paging flag once the new page's data is settled. Depends on
  // queryData/page/perPage too, so it also clears when navigating to a page
  // that is already cached fresh (no refetch → isFetching never toggles).
  useEffect(() => {
    if (!isFetching) {
      setIsPaging(false);
      setIsFilterPending(false);
    }
  }, [isFetching, queryData, page, perPage]);

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

  const pushUrl = useCallback(
    (
      nextFilters: CarPageFilters,
      nextPage: number,
      nextPerPage: number,
      replace = false
    ) => {
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
    (nextFilters: CarPageFilters, { replace = false }: { replace?: boolean } = {}) => {
      setIsFilterPending(true);
      setFilters(nextFilters);
      setPage(1);
      pushUrl(nextFilters, 1, perPage, replace);
    },
    [perPage, pushUrl]
  );

  // Set a single field and apply.
  const setFilter = useCallback(
    (key: keyof CarPageFilters, value: unknown) =>
      applyFilters({ ...filters, [key]: value }),
    [filters, applyFilters]
  );

  // Merge a partial filters patch (used by hero quick-picks) and apply.
  const applyPatch = useCallback(
    (patch: Partial<CarPageFilters>) => applyFilters({ ...filters, ...patch }),
    [filters, applyFilters]
  );

  // Toggle one value in a multi-select array field.
  const toggleMulti = useCallback(
    (key: MultiKey, value: string) => {
      const current: string[] = filters[key] || [];
      const next = current.includes(value)
        ? current.filter((v: string) => v !== value)
        : [...current, value];
      applyFilters({ ...filters, [key]: next });
    },
    [filters, applyFilters]
  );

  // Search-as-you-type: the input updates immediately; the committed filter
  // (which drives the fetch + URL) is debounced so we don't query per keystroke
  // or flood the back stack.
  const setSearch = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        const nextSearch = value || undefined;
        // No-op commits (debounce fired but the term is unchanged) shouldn't
        // flash skeletons over identical results.
        if (nextSearch === filtersRef.current.search) return;
        const next = { ...filtersRef.current, search: nextSearch };
        setIsFilterPending(true);
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
    (sortBy: string) => {
      const next = { ...filters, sortBy };
      setFilters(next);
      pushUrl(next, page, perPage);
    },
    [filters, page, perPage, pushUrl]
  );

  const changePage = useCallback(
    (nextPage: number) => {
      setIsPaging(true);
      setPage(nextPage);
      pushUrl(filters, nextPage, perPage);
      scrollToResults();
    },
    [filters, perPage, pushUrl, scrollToResults]
  );

  const changePerPage = useCallback(
    (nextPerPage: number) => {
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
    (
      minKey: keyof CarPageFilters,
      maxKey: keyof CarPageFilters,
      [min, max]: [number, number],
      bounds?: { min: number; max: number }
    ) => {
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
    (type: string, value?: string) => {
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
        case "color":
          next.color = undefined;
          break;
        case "minSeats":
          next.minSeats = undefined;
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

  const getActiveFilters = useCallback(() => buildActiveFilterChips(filters), [filters]);

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
    isFilterPending,
    isError,
    // Only the error branch carries `error`; narrow before reading it.
    errorMessage:
      queryData && !queryData.success ? queryData.error.message : undefined,
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
