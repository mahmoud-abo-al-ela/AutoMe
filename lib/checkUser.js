import { auth, currentUser } from "@clerk/nextjs/server";
import { headers } from "next/headers";
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
};

/**
 * Get the current authenticated user, creating them if they don't exist
 * Also checks for impersonation context for Super Admins
 */
export async function checkUser() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  let userData = await findOrCreateUser(userId);

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

async function findOrCreateUser(clerkId) {
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
    const email = clerkUser.emailAddresses[0]?.emailAddress;

    userData = await db.user.create({
      data: {
        clerkId,
        name,
        imageUrl: clerkUser.imageUrl,
        email,
      },
      include: userIncludeQuery,
    });
  }

  return userData;
}

async function assignPendingOrganizations(userData) {
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

  // Refetch user with updated memberships
  return await db.user.findUnique({
    where: { id: userData.id },
    include: userIncludeQuery,
  });
}

async function resolveImpersonation(userData) {
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
