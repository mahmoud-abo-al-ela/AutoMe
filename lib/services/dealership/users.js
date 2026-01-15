// Dealership user management service functions
import { clerkClient } from "@clerk/nextjs/server";
import * as userRepository from "@/lib/repositories/user";
import { db } from "@/lib/prisma";
import {
  AuthenticationError,
  NotFoundError,
  AuthorizationError,
} from "@/lib/utils/errors";

/**
 * Get organization members with search and pagination
 */
export async function getUsers(search, pagination, userId, organizationId) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  // Verify user has OWNER access to this organization
  const hasOwnerAccess = user.memberships?.some(
    m => m.organizationId === organizationId && m.role === "OWNER"
  );
  if (!hasOwnerAccess && user.role !== "ADMIN") {
    throw new AuthorizationError("Only organization owners can view members");
  }

  const { page = 1, limit = 10 } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    organizationId,
    ...(search && {
      user: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
    }),
  };

  const [memberships, total] = await Promise.all([
    db.membership.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.membership.count({ where }),
  ]);

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
export async function updateUserRole(targetUserId, role, userId, organizationId) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  // Verify user has OWNER access to this organization
  const hasOwnerAccess = user.memberships?.some(
    m => m.organizationId === organizationId && m.role === "OWNER"
  );
  if (!hasOwnerAccess && user.role !== "ADMIN") {
    throw new AuthorizationError("Only organization owners can update member roles");
  }

  // Update the user's global role (ADMIN/USER)
  await db.user.update({
    where: { id: targetUserId },
    data: { role },
  });
}

/**
 * Delete user (remove from organization)
 */
export async function deleteUser(targetUserId, userId, organizationId) {
  const adminUser = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!adminUser) {
    throw new AuthenticationError("User not found");
  }

  // Verify user has OWNER access to this organization
  const hasOwnerAccess = adminUser.memberships?.some(
    m => m.organizationId === organizationId && m.role === "OWNER"
  );
  if (!hasOwnerAccess && adminUser.role !== "ADMIN") {
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
  const membership = await db.membership.findFirst({
    where: {
      userId: targetUserId,
      organizationId,
    },
  });

  if (!membership) {
    throw new NotFoundError("User is not a member of this organization");
  }

  // Don't allow deleting the owner
  if (membership.role === "OWNER") {
    throw new AuthorizationError("Cannot remove the organization owner");
  }

  // Remove membership (not deleting the user from the system)
  await db.membership.delete({
    where: { id: membership.id },
  });
}
