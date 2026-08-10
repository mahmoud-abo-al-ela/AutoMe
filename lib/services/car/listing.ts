// Car listing and filter service functions
import * as carRepository from "@/lib/repositories/car";
import * as userRepository from "@/lib/repositories/user";

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

  return await carRepository.findManyCars(queryFilters, pagination);
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
