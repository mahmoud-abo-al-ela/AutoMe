// Car listing and filter service functions
import * as carRepository from "@/lib/repositories/car";
import * as userRepository from "@/lib/repositories/user";
import { searchMeaning, type SearchMeaning } from "@/lib/services/car/search-meaning";
import { writtenForm } from "@/lib/search/highlight";

/**
 * The car listing filter set, as understood by buildCarWhereClause. Declared
 * here rather than in the repository because lib/repositories/car/* is still
 * JavaScript (its where-builder is deferred); move this there on conversion.
 */
export interface CarFilters {
  organizationId?: string;
  dealership?: string;
  city?: string;
  status?: string;
  onlyAvailable?: boolean;
  search?: string;
  make?: string | string[];
  bodyType?: string | string[];
  fuelType?: string | string[];
  transmission?: string | string[];
  color?: string;
  minSeats?: number | null;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  featured?: boolean;
  sortBy?: string;
  /** Set by getCars, never by a caller: the search text's meaning, for hybrid ranking. */
  meaning?: SearchMeaning | null;
}

/**
 * How a search's words matched the cars (see searchCarsRanked): all of them,
 * some (no car has them all), or by meaning alone (no word did) — the words no
 * car in scope has, which were set aside, and the typos read as known words
 * (`to` holds several when the search could not tell which was meant).
 */
export interface SearchMatch {
  match: "all" | "some" | "meaning" | "none";
  missing: string[];
  corrected: { from: string; to: string[] }[];
}

export interface CarPagination {
  page?: number;
  limit?: number;
}

/**
 * Get cars with filters and pagination (organization-scoped)
 */
export async function getCars(
  filters: CarFilters,
  pagination: CarPagination,
  userId?: string | null,
  organizationId?: string | null
) {
  // If we have a user and they are accessing a specific organization, 
  // we could check permissions, but for public listings we don't need to.
  // However, if this is intended for the dashboard, we should check.
  // For now, let's make it robust to missing userId.
  
  if (userId && organizationId) {
    const user = await userRepository.findUserByClerkIdWithMemberships(userId);
    if (user) {
      // Verify user has access to this organization ONLY if they are not a global ADMIN
      const hasAccess = user.memberships?.some(m => m.organizationId === organizationId);
      if (!hasAccess && user.role !== "ADMIN") {
        // If it's a public request, we don't want to throw. 
        // We only throw if the request specifically requires management access.
        // For now, let's just filter by organizationId as requested.
      }
    }
  }

  // Add organization filter if provided
  const queryFilters = { ...filters };
  if (organizationId) {
    queryFilters.organizationId = organizationId;
    delete queryFilters.dealership;
    delete queryFilters.city;
  }

  // Free text is ranked by its meaning as well as its words; null (no key,
  // busy, slow) leaves the search on its words alone.
  queryFilters.meaning = await searchMeaning(filters.search);

  const result = await carRepository.findManyCars(queryFilters, pagination);

  // The words alone emptied a search the buyer also filtered — "family" in
  // "family SUV under 1.5 million", which no listing may say in so many words.
  // Show what the filters find instead, and say which words were set aside;
  // a plain search with nothing else to go on is never widened.
  const search = filters.search?.trim();
  if (result.pagination.total === 0 && search && hasCarFilters(filters)) {
    const widened = await carRepository.findManyCars({ ...queryFilters, search: undefined, meaning: null }, pagination);
    if (widened.pagination.total > 0) return { ...widened, search: null, relaxedSearch: search };
  }
  // Only the ranked branch (a search term) reports how the words matched.
  const match = "search" in result ? (result.search as SearchMatch) : null;
  return { ...result, search: match && spellCorrections(match, result.cars), relaxedSearch: null as string | null };
}

/** The fields a car is shown and found by. */
const CAR_TEXT_FIELDS = ["titleAr", "titleEn", "title", "make", "model", "descriptionAr", "descriptionEn", "description"];

/**
 * The corrected words as the cars found spell them. The vocabulary holds words
 * folded for search, so a correction would read "فتحه" where the listings say
 * "فتحة"; the results have the word, written right.
 */
function spellCorrections(match: SearchMatch, cars: unknown[]): SearchMatch {
  if (match.corrected.length === 0) return match;
  const texts = cars.flatMap((car) => {
    if (!car || typeof car !== "object") return [];
    const fields = car as Record<string, unknown>;
    return [...CAR_TEXT_FIELDS.map((key) => fields[key]), fields.features, fields.featuresAr]
      .flat()
      .filter((value): value is string => typeof value === "string");
  });
  return {
    ...match,
    corrected: match.corrected.map(({ from, to }) => ({ from, to: to.map((word) => writtenForm(word, texts) ?? word) })),
  };
}

/** Whether the buyer narrowed by anything about the car itself, beyond the words. */
function hasCarFilters(filters: CarFilters): boolean {
  const set = (value: unknown) =>
    value !== undefined && value !== null && value !== "" && !(Array.isArray(value) && value.length === 0);
  return [
    filters.make,
    filters.bodyType,
    filters.fuelType,
    filters.transmission,
    filters.color,
    filters.minSeats,
    filters.minPrice,
    filters.maxPrice,
    filters.minYear,
    filters.maxYear,
    filters.minMileage,
    filters.maxMileage,
  ].some(set);
}

/**
 * Get filter options (organization-scoped)
 */
export async function getFilterOptions(
  baseFilters: CarFilters = {},
  userId?: string | null,
  organizationId?: string | null
) {
  // Add organization filter if provided
  const queryFilters = { ...baseFilters };
  if (organizationId) {
    queryFilters.organizationId = organizationId;
    delete queryFilters.dealership;
    delete queryFilters.city;
  }

  // Global (unfiltered) bounds pin the slider domains so they don't shift as
  // the user applies other filters. Only the tenant scope is honored here.
  const boundsFilters = organizationId ? { organizationId } : {};
  const boundsPromise = Promise.all([
    carRepository.getCarPriceRange(boundsFilters),
    carRepository.getCarYearRange(boundsFilters),
    carRepository.getCarMileageRange(boundsFilters),
  ]);

  const options = (await searchOptions(queryFilters, baseFilters)) ?? (await plainOptions(queryFilters));
  const [priceBounds, yearBounds, mileageBounds] = await boundsPromise;

  return {
    ...options,
    makes: keepSelected(options.makes, baseFilters.make),
    bodyTypes: keepSelected(options.bodyTypes, baseFilters.bodyType),
    fuelTypes: keepSelected(options.fuelTypes, baseFilters.fuelType),
    transmissions: keepSelected(options.transmissions, baseFilters.transmission),
    colors: keepSelected(options.colors, baseFilters.color),
    cities:
      queryFilters.city && !options.cities.some((city) => sameValue(city, queryFilters.city!))
        ? [...options.cities, queryFilters.city].sort()
        : options.cities,
    priceBounds,
    yearBounds,
    mileageBounds,
  };
}

/**
 * The options for a search with text, counted over the cars its results are
 * made of (searchFacets) — or null when there is no text, or when its words
 * empty a search the buyer also filtered: getCars then shows what the filters
 * find, and the options follow it.
 */
async function searchOptions(queryFilters: CarFilters, baseFilters: CarFilters) {
  const search = queryFilters.search?.trim();
  if (!search) return null;

  // The results asked for the same meaning a moment ago; it comes from the cache.
  const facets = await carRepository.searchFacets({ ...queryFilters, search, meaning: await searchMeaning(search) });
  if (facets.total === 0 && hasCarFilters(baseFilters)) return null;
  return {
    makes: facets.counts.make,
    bodyTypes: facets.counts.bodyType,
    fuelTypes: facets.counts.fuelType,
    transmissions: facets.counts.transmission,
    colors: facets.counts.color,
    priceRange: facets.priceRange,
    dealerships: facets.dealerships,
    cities: facets.cities,
  };
}

/** The options for a listing without search text. */
async function plainOptions(queryFilters: CarFilters) {
  const filters = { ...queryFilters, search: undefined };
  const [makes, bodyTypes, fuelTypes, transmissions, colors, priceRange, dealerships, cities] = await Promise.all([
    carRepository.getCarFieldCounts("make", filters),
    carRepository.getCarFieldCounts("bodyType", filters),
    carRepository.getCarFieldCounts("fuelType", filters),
    carRepository.getCarFieldCounts("transmission", filters),
    carRepository.getCarFieldCounts("color", filters),
    carRepository.getCarPriceRange(filters),
    filters.organizationId ? Promise.resolve([]) : carRepository.getCarDealershipOptions(filters),
    filters.organizationId ? Promise.resolve([]) : carRepository.getCarCityOptions(filters),
  ]);
  return { makes, bodyTypes, fuelTypes, transmissions, colors, priceRange, dealerships, cities };
}

const sameValue = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * A selected value stays in its list — at 0 when no car has it any more — so
 * the buyer can still see it chosen and unchoose it there.
 */
export function keepSelected<T extends { value: string; count: number }>(
  options: T[],
  selected: string | string[] | undefined
): (T | { value: string; count: number })[] {
  const chosen = (Array.isArray(selected) ? selected : selected ? [selected] : []).filter(
    (value) => value && !options.some((option) => sameValue(option.value, value))
  );
  if (chosen.length === 0) return options;
  return [...options, ...chosen.map((value) => ({ value, count: 0 }))].sort((a, b) =>
    a.value < b.value ? -1 : a.value > b.value ? 1 : 0
  );
}
