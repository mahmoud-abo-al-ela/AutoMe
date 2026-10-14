import { auth, currentUser } from "@clerk/nextjs/server";
import * as tenantRepository from "@/lib/repositories/tenant";
import type { UserWithOrganizations } from "@/lib/repositories/tenant";
import { createAuditLogEntry } from "@/lib/repositories/audit";
import { relinkMigratedUser } from "@/lib/services/user/clerk-sync";
import { resolveActiveImpersonation, type ActiveImpersonation } from "@/lib/services/impersonation/active";

export type { UserWithOrganizations };

/**
 * What checkUser resolves to: the user row, plus the impersonation marker when
 * an admin is viewing as someone else. The extras are optional because the
 * non-impersonating path returns the row unchanged.
 */
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

  // The email check is load-bearing, not defensive. `assignPendingOrganizations`
  // matches on `pendingOwnerEmail: userData.email`, and Prisma turns a null into
  // `IS NULL` — which matches every organization still awaiting an owner and
  // would grant this user OWNER membership on all of them. Now that
  // `User.email` is nullable, that is reachable rather than theoretical.
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
      // find-then-create is not atomic. A first page load renders several
      // server components concurrently, each calling checkUser; they all miss
      // on the lookup above and race to insert. Whoever loses gets P2002 on the
      // unique clerkId — the row now exists, so re-read it instead of throwing.
      // Read `code` structurally: the generated client re-exports
      // PrismaClientKnownRequestError via `export import`, which is a type
      // alias, so `instanceof` does not narrow against it.
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

/**
 * Swap to the impersonated member only inside a support session the database
 * verifies (lib/services/impersonation/active.ts) — never on a cookie or header
 * alone. The target comes from the session row, and the verified session rides
 * along as `impersonation`, so tenant resolution decides on the same session
 * this swap used rather than reading it a second time.
 */
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
