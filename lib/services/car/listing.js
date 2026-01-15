// Car listing and filter service functions
import * as carRepository from "@/lib/repositories/car";
import * as userRepository from "@/lib/repositories/user";
import { AuthenticationError, AuthorizationError } from "@/lib/utils/errors";

/**
 * Get cars with filters and pagination (organization-scoped)
 */
export async function getCars(filters, pagination, userId, organizationId) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  // Verify user has access to this organization
  const hasAccess = user.memberships?.some(m => m.organizationId === organizationId);
  if (!hasAccess && user.role !== "ADMIN") {
    throw new AuthorizationError("You don't have access to this organization");
  }

  // Add organization filter
  const orgFilters = { ...filters, organizationId };

  return await carRepository.findManyCars(orgFilters, pagination);
}

/**
 * Get filter options (organization-scoped)
 */
export async function getFilterOptions(baseFilters = {}, userId, organizationId) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  // Verify user has access to this organization
  const hasAccess = user.memberships?.some(m => m.organizationId === organizationId);
  if (!hasAccess && user.role !== "ADMIN") {
    throw new AuthorizationError("You don't have access to this organization");
  }

  // Add organization filter
  const orgFilters = { ...baseFilters, organizationId };

  const [makes, bodyTypes, fuelTypes, transmissions, priceRange] =
    await Promise.all([
      carRepository.getCarDistinctValues("make", orgFilters),
      carRepository.getCarDistinctValues("bodyType", orgFilters),
      carRepository.getCarDistinctValues("fuelType", orgFilters),
      carRepository.getCarDistinctValues("transmission", orgFilters),
      carRepository.getCarPriceRange(orgFilters),
    ]);

  return {
    makes,
    bodyTypes,
    fuelTypes,
    transmissions,
    priceRange,
  };
}
