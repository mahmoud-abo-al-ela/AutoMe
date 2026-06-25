// Dealership service functions
import * as workingHoursRepository from "@/lib/repositories/dealership/working-hours";
import * as dealershipRepository from "@/lib/repositories/dealership/queries";
import * as userRepository from "@/lib/repositories/user";
import { AuthenticationError, AuthorizationError } from "@/lib/utils/errors";

async function getAuthorizedUser(userId, organizationId, ownerOnly = false) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const hasAccess = user.memberships?.some((membership) => {
    if (membership.organizationId !== organizationId) return false;
    return ownerOnly ? membership.role === "OWNER" : true;
  });

  if (!hasAccess && user.role !== "ADMIN") {
    throw new AuthorizationError(
      ownerOnly
        ? "Only organization owners can update organization profile"
        : "You don't have access to this organization"
    );
  }

  return user;
}

/**
 * Get organization profile for settings
 */
export async function getOrganizationProfile(userId, organizationId) {
  await getAuthorizedUser(userId, organizationId);
  const profile = await dealershipRepository.findOrganizationProfile(organizationId);
  return { profile };
}

/**
 * Update organization profile for settings
 */
export async function updateOrganizationProfile(profileData, userId, organizationId) {
  await getAuthorizedUser(userId, organizationId, true);
  return dealershipRepository.updateOrganizationProfile(organizationId, profileData);
}

/**
 * Get working hours for an organization
 */
export async function getWorkingHours(userId, organizationId) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  // Verify user has access to this organization
  const hasAccess = user.memberships?.some(m => m.organizationId === organizationId);
  if (!hasAccess && user.role !== "ADMIN") {
    throw new AuthorizationError("You don't have access to this organization");
  }

  const workingHours = await workingHoursRepository.findWorkingHours(organizationId);

  return { workingHours };
}

/**
 * Update working hours for an organization
 */
export async function updateWorkingHours(workingHours, userId, organizationId) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  // Verify user has OWNER access to this organization
  const hasOwnerAccess = user.memberships?.some(
    m => m.organizationId === organizationId && m.role === "OWNER"
  );
  if (!hasOwnerAccess && user.role !== "ADMIN") {
    throw new AuthorizationError("Only organization owners can update working hours");
  }

  await workingHoursRepository.updateWorkingHours(organizationId, workingHours);
}
