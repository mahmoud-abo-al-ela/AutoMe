import type { MemberRole } from "@/lib/generated/prisma";
import * as tenantRepository from "@/lib/repositories/tenant";
import { AuthorizationError } from "@/lib/utils/errors";

export async function checkOrganizationAccess(
  userId: string,
  organizationId: string,
  requiredRole: MemberRole | null = null
): Promise<boolean> {
  const membership = await tenantRepository.findMembershipRow(userId, organizationId);

  if (!membership) return false;

  if (requiredRole) {
    const roleHierarchy: Record<string, number> = { OWNER: 3, ADMIN: 2, MEMBER: 1 };
    const userRoleLevel = roleHierarchy[membership.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    return userRoleLevel >= requiredLevel;
  }

  return true;
}

export async function getUserMembership(userId: string, organizationId: string) {
  return tenantRepository.findMembershipWithOrganization(userId, organizationId);
}

/**
 * Ensures the user is the OWNER of the organization.
 * Throws an AuthorizationError if not.
 */
export async function requireOwner(userId: string, organizationId: string) {
  const membership = await getUserMembership(userId, organizationId);
  if (!membership || membership.role !== "OWNER") {
    throw new AuthorizationError("Only owners can perform this action");
  }
  return membership;
}
