// Pure URL <-> filter-state helpers for the dealerships listing. Kept in a
// non-"use client" module so the SSR page (a Server Component) and the client
// hook can share one implementation. No React, no browser APIs here.

import {
    DEFAULT_DEALERSHIP_SORT,
    DEFAULT_DEALERSHIP_PER_PAGE,
} from "@/lib/constants/dealership-options";

/** The dealerships page's URL-backed filter state. */
export interface DealershipPageFilters {
    search?: string;
    city?: string;
    region?: string;
    minRating?: number;
    minCarCount?: number;
    maxCarCount?: number;
    sort: string;
}

export const DEFAULT_FILTERS: DealershipPageFilters = {
    search: undefined,
    city: undefined,
    region: undefined,
    minRating: undefined,
    minCarCount: undefined,
    maxCarCount: undefined,
    sort: DEFAULT_DEALERSHIP_SORT,
};

// Only the filters that hit the server.
export const SERVER_FILTER_KEYS = [
    "search",
    "city",
    "region",
    "minRating",
    "minCarCount",
    "maxCarCount",
    "sort",
] as const satisfies readonly (keyof DealershipPageFilters)[];

export const pickServerFilters = (
    filters: DealershipPageFilters
): Partial<DealershipPageFilters> =>
    SERVER_FILTER_KEYS.reduce<Partial<DealershipPageFilters>>((acc, key) => {
        if (filters[key] !== undefined) {
            // Key-by-key copy across a union of value types; the read and the
            // write use the same key, so the assignment is sound.
            (acc[key] as unknown) = filters[key];
        }
        return acc;
    }, {});

const num = (v: string | null | undefined) =>
    v !== null && v !== undefined && v !== "" ? Number(v) : undefined;

/** Parse a `?query=string` (with or without leading ?) into filters + page/perPage. */
export function parseFiltersFromSearch(search: string): {
    filters: DealershipPageFilters;
    page: number;
    perPage: number;
} {
    const p = new URLSearchParams(search);

    return {
        filters: {
            search: p.get("search") || undefined,
            city: p.get("city") || undefined,
            region: p.get("region") || undefined,
            minRating: num(p.get("minRating")),
            minCarCount: num(p.get("minCarCount")),
            maxCarCount: num(p.get("maxCarCount")),
            sort: p.get("sort") || DEFAULT_DEALERSHIP_SORT,
        },
        page: num(p.get("page")) || 1,
        perPage: num(p.get("perPage")) || DEFAULT_DEALERSHIP_PER_PAGE,
    };
}

/** Serialize filters + page/perPage back into a `/dealerships?...` URL. */
export function buildDealershipsUrl(
    filters: DealershipPageFilters,
    page: number,
    perPage?: number
): string {
    const params = new URLSearchParams();

    if (filters.search) params.set("search", filters.search);
    if (filters.city) params.set("city", filters.city);
    if (filters.region) params.set("region", filters.region);
    if (filters.minRating) params.set("minRating", String(filters.minRating));
    if (filters.minCarCount) params.set("minCarCount", String(filters.minCarCount));
    if (filters.maxCarCount) params.set("maxCarCount", String(filters.maxCarCount));
    if (filters.sort && filters.sort !== DEFAULT_DEALERSHIP_SORT) params.set("sort", filters.sort);
    if (perPage && perPage !== DEFAULT_DEALERSHIP_PER_PAGE) params.set("perPage", String(perPage));
    if (page > 1) params.set("page", String(page));

    const qs = params.toString();
    return qs ? `/dealerships?${qs}` : "/dealerships";
}
