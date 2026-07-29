"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { getDealerships, getDealershipFilters } from "@/actions/dealerships";
import {
  DEFAULT_DEALERSHIP_SORT,
  DEFAULT_DEALERSHIP_PER_PAGE,
} from "@/lib/constants/dealership-options";
import {
  DEFAULT_FILTERS,
  pickServerFilters,
  parseFiltersFromSearch,
  buildDealershipsUrl,
} from "@/hooks/dealerships-url";

export {
  DEFAULT_DEALERSHIP_SORT,
  DEFAULT_DEALERSHIP_PER_PAGE,
};
export { parseFiltersFromSearch, buildDealershipsUrl } from "@/hooks/dealerships-url";

export const useDealershipsPage = (initialData = null, initialState = null) => {
  // Prefer the server-parsed state (identical on server and client → no
  // hydration mismatch); fall back to parsing the URL on the client only.
  const initial =
    initialState ||
    parseFiltersFromSearch(typeof window !== "undefined" ? window.location.search : "");

  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...initial.filters });
  const [page, setPage] = useState(initial.page || 1);
  const [perPage, setPerPage] = useState(initial.perPage || DEFAULT_DEALERSHIP_PER_PAGE);
  // Responsive search field, decoupled from the (debounced) committed filter.
  const [searchInput, setSearchInput] = useState(initial.filters?.search || "");

  // True while a page/perPage change is fetching, so the UI can distinguish
  // paging from a first load.
  const [isPaging, setIsPaging] = useState(false);

  // Only seed react-query with SSR data while the key still matches the server's.
  const isInitialKeyRef = useRef(true);
  const searchDebounceRef = useRef(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const serverFilters = pickServerFilters(filters);
  const listKey = queryKeys.dealerships.list({ ...serverFilters, page, perPage });

  const {
    data: queryData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: listKey,
    queryFn: () => getDealerships(serverFilters, { page, limit: perPage }),
    placeholderData: keepPreviousData,
    initialData: isInitialKeyRef.current ? initialData : undefined,
  });

  // Cross-filtered facet options (city/region counts) + platform stats.
  const { data: optionsData, isLoading: optionsLoading } = useQuery({
    queryKey: queryKeys.dealerships.filters(serverFilters),
    queryFn: () => getDealershipFilters(serverFilters),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    isInitialKeyRef.current = false;
  }, [filters, page, perPage]);

  useEffect(() => {
    if (!isFetching) setIsPaging(false);
  }, [isFetching, queryData, page, perPage]);

  // Back/forward: our URL writes bypass the router, so re-read on popstate.
  useEffect(() => {
    const onPop = () => {
      const parsed = parseFiltersFromSearch(window.location.search);
      setFilters({ ...DEFAULT_FILTERS, ...parsed.filters });
      setPage(parsed.page);
      setPerPage(parsed.perPage);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const pushUrl = useCallback((nextFilters, nextPage, nextPerPage, replace = false) => {
    const url = buildDealershipsUrl(nextFilters, nextPage, nextPerPage);
    if (replace) {
      window.history.replaceState(null, "", url);
    } else {
      window.history.pushState(null, "", url);
    }
  }, []);

  const scrollToResults = useCallback(() => {
    if (typeof window === "undefined") return;
    requestAnimationFrame(() => {
      const section = document.getElementById("dealerships-results");
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

  // Toggle a single-value field: selecting the active value clears it.
  const toggleFilter = useCallback(
    (key, value) => setFilter(key, filters[key] === value ? undefined : value),
    [filters, setFilter]
  );

  // Search-as-you-type: input updates immediately; the committed filter (which
  // drives the fetch + URL) is debounced so we don't query per keystroke.
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

  useEffect(() => {
    setSearchInput(filters.search || "");
  }, [filters.search]);

  const setSort = useCallback(
    (sort) => {
      const next = { ...filters, sort };
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

  // Commit a [min, max] car-count range. Values at the domain bounds are
  // dropped so we don't pin the URL to the full range.
  const commitCarCount = useCallback(
    ([min, max], bounds) => {
      const next = {
        ...filters,
        minCarCount: bounds && min <= bounds.min ? undefined : min || undefined,
        maxCarCount: bounds && max >= bounds.max ? undefined : max || undefined,
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

  // Clear one active-filter chip.
  const clearFilter = useCallback(
    (type) => {
      const next = { ...filters };
      switch (type) {
        case "search":
          next.search = undefined;
          break;
        case "city":
          next.city = undefined;
          break;
        case "region":
          next.region = undefined;
          break;
        case "minRating":
          next.minRating = undefined;
          break;
        case "carCount":
          next.minCarCount = undefined;
          next.maxCarCount = undefined;
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
    if (filters.search) chips.push({ type: "search", label: `“${filters.search}”` });
    if (filters.city) chips.push({ type: "city", label: filters.city });
    if (filters.region) chips.push({ type: "region", label: filters.region });
    if (filters.minRating) chips.push({ type: "minRating", label: `${filters.minRating}+ stars` });
    if (filters.minCarCount || filters.maxCarCount) {
      const min = filters.minCarCount || 0;
      const max = filters.maxCarCount ? filters.maxCarCount : "Any";
      chips.push({ type: "carCount", label: `${min}–${max} cars` });
    }
    return chips;
  }, [filters]);

  const isError = !!error || (queryData && queryData.success === false);

  return {
    dealerships: queryData?.success ? queryData.data.dealerships : [],
    pagination: queryData?.success
      ? queryData.data.pagination
      : { total: 0, page, limit: perPage, totalPages: 0 },
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
      toggleFilter,
      commitCarCount,
      setSearch,
      setSort,
      changePage,
      changePerPage,
      clearFilter,
      resetAllFilters,
    },
  };
};
