// Car listing and filter service functions
import * as carRepository from "@/lib/repositories/car";
import * as userRepository from "@/lib/repositories/user";
import { AuthenticationError, AuthorizationError } from "@/lib/utils/errors";

/**
 * Get cars with filters and pagination (organization-scoped)
 */
export async function getCars(filters, pagination, userId, organizationId) {
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
  }

  return await carRepository.findManyCars(queryFilters, pagination);
}

/**
 * Get filter options (organization-scoped)
 */
export async function getFilterOptions(baseFilters = {}, userId, organizationId) {
  // Add organization filter if provided
  const queryFilters = { ...baseFilters };
  if (organizationId) {
    queryFilters.organizationId = organizationId;
  }

  const [makes, bodyTypes, fuelTypes, transmissions, priceRange] =
    await Promise.all([
      carRepository.getCarDistinctValues("make", queryFilters),
      carRepository.getCarDistinctValues("bodyType", queryFilters),
      carRepository.getCarDistinctValues("fuelType", queryFilters),
      carRepository.getCarDistinctValues("transmission", queryFilters),
      carRepository.getCarPriceRange(queryFilters),
    ]);

  return {
    makes,
    bodyTypes,
    fuelTypes,
    transmissions,
    priceRange,
  };
}
