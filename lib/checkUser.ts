import { auth, currentUser } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

const userIncludeQuery = {
  memberships: {
    include: {
      organization: {
        include: {
          subscription: {
            include: { plan: true },
          },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

/** A User row with memberships → organization → subscription → plan joined. */
export type UserWithOrganizations = Prisma.UserGetPayload<{
  include: typeof userIncludeQuery;
}>;

/**
 * What checkUser resolves to: the user row, plus the impersonation marker when
 * an admin is viewing as someone else. Both extras are optional because the
 * non-impersonating path returns the row unchanged.
 */
export type CurrentUser = UserWithOrganizations & {
  isImpersonated?: boolean;
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
    userData = await assignPendingOrganizations(userData);
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

  return db.user.findUnique({
    where: { clerkId: userId },
  });
}

/**
 * INTERNAL HELPERS
 */

async function findOrCreateUser(clerkId: string): Promise<UserWithOrganizations> {
  let userData = await db.user.findUnique({
    where: { clerkId },
    include: userIncludeQuery,
  });

  if (!userData) {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error("Clerk user not found despite auth() returning userId");
    }

    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
    // Explicitly null rather than undefined: phone-only and some passwordless
    // Clerk signups carry no address, and `User.email` is nullable for them.
    // Leaving it undefined would rely on Prisma's omit-means-default behaviour
    // for a column that has no default.
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;

    try {
      userData = await db.user.create({
        data: {
          clerkId,
          name,
          imageUrl: clerkUser.imageUrl,
          email,
        },
        include: userIncludeQuery,
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

      userData = await db.user.findUnique({
        where: { clerkId },
        include: userIncludeQuery,
      });
      if (!userData) throw error;
    }
  }

  return userData;
}

async function assignPendingOrganizations(
  userData: UserWithOrganizations
): Promise<UserWithOrganizations> {
  const pendingOrgs = await db.organization.findMany({
    where: { pendingOwnerEmail: userData.email },
  });

  if (pendingOrgs.length === 0) {
    return userData;
  }

  for (const org of pendingOrgs) {
    await db.membership.create({
      data: {
        userId: userData.id,
        organizationId: org.id,
        role: "OWNER",
        acceptedAt: new Date(),
      },
    });

    await db.organization.update({
      where: { id: org.id },
      data: { pendingOwnerEmail: null },
    });

    await db.auditLog.create({
      data: {
        action: "MEMBER_ACCEPTED",
        entityType: "MEMBERSHIP",
        entityId: userData.id,
        organizationId: org.id,
        userId: userData.id,
        userEmail: userData.email,
        metadata: { role: "OWNER", autoAssigned: true },
      },
    });
  }

  // Refetch user with updated memberships. Read by primary key for a row this
  // request just loaded, so the null branch is unreachable.
  return (await db.user.findUnique({
    where: { id: userData.id },
    include: userIncludeQuery,
  })) as UserWithOrganizations;
}

async function resolveImpersonation(
  userData: UserWithOrganizations
): Promise<CurrentUser> {
  const headersList = await headers();
  const isImpersonating = headersList.get("x-impersonation-active") === "true";
  const impersonatedUserId = headersList.get("x-impersonated-user");

  if (isImpersonating && userData.role === "ADMIN" && impersonatedUserId) {
    const impersonatedUser = await db.user.findUnique({
      where: { id: impersonatedUserId },
      include: userIncludeQuery,
    });

    if (impersonatedUser) {
      return {
        ...impersonatedUser,
        isImpersonated: true,
        actualUser: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
        },
      };
    }
  }

  return userData;
}
