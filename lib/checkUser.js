import { auth, currentUser } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { db } from "@/lib/prisma";

/**
 * Get the current authenticated user, creating them if they don't exist
 * Also checks for impersonation context for Super Admins
 */
export async function checkUser() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return null;
    }

    // Check for impersonation context
    const headersList = await headers();
    const isImpersonating =
      headersList.get("x-impersonation-active") === "true";
    const impersonatedUserId = headersList.get("x-impersonated-user");

    try {
      // First, get the actual authenticated user
      let userData = await db.user.findUnique({
        where: {
          clerkId: userId,
        },
        include: {
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
        },
      });

      // If user doesn't exist, create them
      if (!userData) {
        const clerkUser = await currentUser();

        if (!clerkUser) {
          return null;
        }

        const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""
          }`.trim();
        const email = clerkUser.emailAddresses[0]?.emailAddress;

        // Check if a user with this email exists (might be orphaned from Clerk deletion)
        const existingUserByEmail = await db.user.findUnique({
          where: { email },
        });

        if (existingUserByEmail) {
          // Update the existing user with new Clerk ID
          userData = await db.user.update({
            where: { email },
            data: {
              clerkId: userId,
              name,
              imageUrl: clerkUser.imageUrl,
            },
            include: {
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
            },
          });
        } else {
          // Create new user
          userData = await db.user.create({
            data: {
              clerkId: userId,
              name,
              imageUrl: clerkUser.imageUrl,
              email,
            },
            include: {
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
            },
          });
        }

        // Check for any organizations waiting for this user as owner
        if (email) {
          const pendingOrgs = await db.organization.findMany({
            where: { pendingOwnerEmail: email },
          });

          for (const org of pendingOrgs) {
            // Create OWNER membership
            await db.membership.create({
              data: {
                userId: userData.id,
                organizationId: org.id,
                role: "OWNER",
                acceptedAt: new Date(),
              },
            });

            // Clear the pending owner email
            await db.organization.update({
              where: { id: org.id },
              data: { pendingOwnerEmail: null },
            });

            // Log the event
            await db.auditLog.create({
              data: {
                action: "MEMBER_ACCEPTED",
                entityType: "MEMBERSHIP",
                entityId: userData.id,
                organizationId: org.id,
                userId: userData.id,
                userEmail: email,
                metadata: { role: "OWNER", autoAssigned: true },
              },
            });
          }

          // Refetch user with updated memberships
          if (pendingOrgs.length > 0) {
            userData = await db.user.findUnique({
              where: { id: userData.id },
              include: {
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
              },
            });
          }
        }
      }

      if (
        isImpersonating &&
        userData.role === "ADMIN" &&
        impersonatedUserId
      ) {
        const impersonatedUser = await db.user.findUnique({
          where: { id: impersonatedUserId },
          include: {
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
          },
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
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
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
  try {
    const { userId } = await auth();
    if (!userId) return null;

    return db.user.findUnique({
      where: { clerkId: userId },
    });
  } catch (error) {
    console.error("Error getting actual user:", error);
    return null;
  }
}
