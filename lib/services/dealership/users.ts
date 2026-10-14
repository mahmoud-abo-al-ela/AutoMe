// Dealership user management service functions
import type { UserRole } from "@/lib/generated/prisma";
import { clerkClient } from "@clerk/nextjs/server";
import * as userRepository from "@/lib/repositories/user";
import * as teamRepository from "@/lib/repositories/team";
import {
  AuthenticationError,
  NotFoundError,
  AuthorizationError,
} from "@/lib/utils/errors";
import { isImpersonatingOrganization } from "@/lib/services/impersonation/active";

/**
 * Get organization members with search and pagination
 */
export async function getUsers(
  search: string | null | undefined,
  pagination: { page?: number; limit?: number },
  userId: string,
  organizationId: string
) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  // Verify user has OWNER access to this organization
  const hasOwnerAccess = user.memberships?.some(
    m => m.organizationId === organizationId && m.role === "OWNER"
  );
  if (!hasOwnerAccess && !(await isImpersonatingOrganization(organizationId))) {
    throw new AuthorizationError("Only organization owners can view members");
  }

  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const { memberships, total } = await teamRepository.findMembersPage({
    organizationId,
    search,
    skip,
    take: limit,
  });

  // Transform to match expected format
  const users = memberships.map(m => ({
    ...m.user,
    membershipId: m.id,
    memberRole: m.role,
    createdAt: m.user.createdAt.toISOString(),
    updatedAt: m.user.updatedAt.toISOString(),
  }));

  return {
    users,
    pagination: {
      total,
      page,
      limit,
    },
  };
}

/**
 * Update user role (within organization context, this updates membership role)
 */
export async function updateUserRole(
  targetUserId: string,
  role: UserRole,
  userId: string,
  organizationId: string
) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  // Verify user has OWNER access to this organization
  const hasOwnerAccess = user.memberships?.some(
    m => m.organizationId === organizationId && m.role === "OWNER"
  );
  if (!hasOwnerAccess && !(await isImpersonatingOrganization(organizationId))) {
    throw new AuthorizationError("Only organization owners can update member roles");
  }

  // The target must actually be a member of this organization — an org owner
  // must not be able to modify a user outside their own tenant.
  const membership = await teamRepository.findMembership(targetUserId, organizationId);
  if (!membership) {
    throw new NotFoundError("User is not a member of this organization");
  }

  // Update the user's global role (ADMIN/USER)
  await userRepository.updateUser(targetUserId, { role });
}

/**
 * Delete user (remove from organization)
 */
export async function deleteUser(
  targetUserId: string,
  userId: string,
  organizationId: string
) {
  const adminUser = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!adminUser) {
    throw new AuthenticationError("User not found");
  }

  // Verify user has OWNER access to this organization
  const hasOwnerAccess = adminUser.memberships?.some(
    m => m.organizationId === organizationId && m.role === "OWNER"
  );
  if (!hasOwnerAccess && !(await isImpersonatingOrganization(organizationId))) {
    throw new AuthorizationError("Only organization owners can remove members");
  }

  const userToDelete = await userRepository.findUserById(targetUserId);
  if (!userToDelete) {
    throw new NotFoundError("User");
  }

  if (userToDelete.clerkId === userId) {
    throw new AuthorizationError("You cannot delete your own account");
  }

  // Check if user is a member of this organization
  const membership = await teamRepository.findMembership(targetUserId, organizationId);

  if (!membership) {
    throw new NotFoundError("User is not a member of this organization");
  }

  // Don't allow deleting the owner
  if (membership.role === "OWNER") {
    throw new AuthorizationError("Cannot remove the organization owner");
  }

  // Remove membership (not deleting the user from the system)
  await teamRepository.deleteMembership(membership.id);
}
