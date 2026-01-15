// Dealership service functions
import * as workingHoursRepository from "@/lib/repositories/dealership/working-hours";
import * as userRepository from "@/lib/repositories/user";
import { AuthenticationError, AuthorizationError } from "@/lib/utils/errors";

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
