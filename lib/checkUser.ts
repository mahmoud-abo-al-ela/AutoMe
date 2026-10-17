import { auth, currentUser } from "@clerk/nextjs/server";
import * as tenantRepository from "@/lib/repositories/tenant";
import type { UserWithOrganizations } from "@/lib/repositories/tenant";
import { createAuditLogEntry } from "@/lib/repositories/audit";
import { relinkMigratedUser } from "@/lib/services/user/clerk-sync";
import { resolveActiveImpersonation, type ActiveImpersonation } from "@/lib/services/impersonation/active";

export type { UserWithOrganizations };

export type CurrentUser = UserWithOrganizations & {
  isImpersonated?: boolean;
  impersonation?: ActiveImpersonation;
  actualUser?: Pick<UserWithOrganizations, "id" | "email" | "name" | "role">;
};

/**
 * Get the current authenticated user, creating them if they don't exist
 * Also checks for impersonation context for Super Admins
 */
export async function checkUser(): Promise<CurrentUser | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  let userData = await findOrCreateUser(userId);

  if (userData.email) {
    userData = await assignPendingOrganizations(userData, userData.email);
  }

  return await resolveImpersonation(userData);
}

/**
 * Check if user is an Admin (platform admin)
 */
export async function isSuperAdmin() {
  const user = await checkUser();
  return user?.role === "ADMIN";
}

/**
 * Get the actual authenticated user (ignores impersonation)
 */
export async function getActualUser() {
  const { userId } = await auth();
  if (!userId) return null;

  return tenantRepository.findUserRowByClerkId(userId);
}

/**
 * INTERNAL HELPERS
 */

async function findOrCreateUser(clerkId: string): Promise<UserWithOrganizations> {
  let userData = await tenantRepository.findUserWithOrganizationsByClerkId(clerkId);

  if (!userData) {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error("Clerk user not found despite auth() returning userId");
    }

    // An account copied from another Clerk instance keeps its row: the copy
    // carries its old ID as externalId (lib/services/user/clerk-sync.ts).
    // Re-read either way — a concurrent request may have just moved it.
    if (clerkUser.externalId) {
      await relinkMigratedUser(clerkId, clerkUser.externalId);
      userData = await tenantRepository.findUserWithOrganizationsByClerkId(clerkId);
      if (userData) return userData;
    }

    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
    // Explicitly null rather than undefined: phone-only and some passwordless
    // Clerk signups carry no address, and `User.email` is nullable for them.
    // Leaving it undefined would rely on Prisma's omit-means-default behaviour
    // for a column that has no default.
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;

    try {
      userData = await tenantRepository.createUserWithOrganizations({
        clerkId,
        name,
        imageUrl: clerkUser.imageUrl,
        email,
      });
    } catch (error) {
      const isDuplicateClerkId =
        typeof error === "object" &&
        error !== null &&
        (error as { code?: string }).code === "P2002";
      if (!isDuplicateClerkId) throw error;

      userData = await tenantRepository.findUserWithOrganizationsByClerkId(clerkId);
      if (!userData) throw error;
    }
  }

  return userData;
}

async function assignPendingOrganizations(
  userData: UserWithOrganizations,
  email: string
): Promise<UserWithOrganizations> {
  const pendingOrgs = await tenantRepository.findOrganizationsAwaitingOwner(email);

  if (pendingOrgs.length === 0) {
    return userData;
  }

  for (const org of pendingOrgs) {
    await tenantRepository.assignPendingOwner(org.id, userData.id);

    await createAuditLogEntry({
      action: "MEMBER_ACCEPTED",
      entityType: "MEMBERSHIP",
      entityId: userData.id,
      organizationId: org.id,
      userId: userData.id,
      userEmail: userData.email,
      metadata: { role: "OWNER", autoAssigned: true },
    });
  }

  // Refetch user with updated memberships. Read by primary key for a row this
  // request just loaded, so the null branch is unreachable.
  return (await tenantRepository.findUserWithOrganizationsById(userData.id)) as UserWithOrganizations;
}

// Impersonate only inside a support session the database verifies, never on a cookie or header alone.
async function resolveImpersonation(
  userData: UserWithOrganizations
): Promise<CurrentUser> {
  if (userData.role !== "ADMIN") return userData;

  const impersonation = await resolveActiveImpersonation();
  if (!impersonation || impersonation.superAdmin.id !== userData.id) return userData;

  const impersonatedUser = await tenantRepository.findUserWithOrganizationsById(impersonation.targetUserId);
  if (!impersonatedUser) return userData;

  return {
    ...impersonatedUser,
    isImpersonated: true,
    impersonation,
    actualUser: {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    },
  };
}
