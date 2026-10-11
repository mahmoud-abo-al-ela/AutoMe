// Car listing and filter service functions
import * as carRepository from "@/lib/repositories/car";
import * as userRepository from "@/lib/repositories/user";
import { searchMeaning, type SearchMeaning } from "@/lib/services/car/search-meaning";

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
    if (widened.pagination.total > 0) return { ...widened, relaxedSearch: search };
  }
  return { ...result, relaxedSearch: null as string | null };
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

  const [
    makes,
    bodyTypes,
    fuelTypes,
    transmissions,
    colors,
    priceRange,
    priceBounds,
    yearBounds,
    mileageBounds,
    dealerships,
    cities,
  ] = await Promise.all([
    carRepository.getCarFieldCounts("make", queryFilters),
    carRepository.getCarFieldCounts("bodyType", queryFilters),
    carRepository.getCarFieldCounts("fuelType", queryFilters),
    carRepository.getCarFieldCounts("transmission", queryFilters),
    carRepository.getCarFieldCounts("color", queryFilters),
    carRepository.getCarPriceRange(queryFilters),
    carRepository.getCarPriceRange(boundsFilters),
    carRepository.getCarYearRange(boundsFilters),
    carRepository.getCarMileageRange(boundsFilters),
    organizationId
      ? Promise.resolve([])
      : carRepository.getCarDealershipOptions(queryFilters),
    organizationId
      ? Promise.resolve([])
      : carRepository.getCarCityOptions(queryFilters),
  ]);

  return {
    makes,
    bodyTypes,
    fuelTypes,
    transmissions,
    colors,
    priceRange,
    priceBounds,
    yearBounds,
    mileageBounds,
    dealerships,
    cities,
  };
}
