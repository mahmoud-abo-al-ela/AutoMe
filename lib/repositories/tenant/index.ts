// Tenant repository - the reads and writes that resolve who is asking and in
// which dealership: lib/checkUser.ts and lib/org/*, on every authenticated
// request. test/tenant-resolution.test.ts pins their behaviour.
import type { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";
import { PUBLIC_DEALERSHIP_WHERE } from "@/lib/repositories/car/visibility";

const WITH_PLAN = {
  subscription: {
    include: { plan: true },
  },
} satisfies Prisma.OrganizationInclude;

/** A user's memberships → organization → subscription → plan. */
export const USER_WITH_ORGANIZATIONS = {
  memberships: {
    include: {
      organization: {
        include: WITH_PLAN,
      },
    },
  },
} satisfies Prisma.UserInclude;

/** A User row with memberships → organization → subscription → plan joined. */
export type UserWithOrganizations = Prisma.UserGetPayload<{
  include: typeof USER_WITH_ORGANIZATIONS;
}>;

/** The user row alone, as stored. */
export async function findUserRowByClerkId(clerkId: string) {
  return db.user.findUnique({
    where: { clerkId },
  });
}

export async function findUserWithOrganizationsByClerkId(clerkId: string) {
  return db.user.findUnique({
    where: { clerkId },
    include: USER_WITH_ORGANIZATIONS,
  });
}

export async function findUserWithOrganizationsById(id: string) {
  return db.user.findUnique({
    where: { id },
    include: USER_WITH_ORGANIZATIONS,
  });
}

/** Throws P2002 if the Clerk id is already taken — the caller handles the race. */
export async function createUserWithOrganizations(data: Prisma.UserUncheckedCreateInput) {
  return db.user.create({
    data,
    include: USER_WITH_ORGANIZATIONS,
  });
}

/** Dealerships a super-admin created for an owner who had not signed up yet. */
export async function findOrganizationsAwaitingOwner(email: string) {
  return db.organization.findMany({
    where: { pendingOwnerEmail: email },
  });
}

/** Make the user the dealership's owner, and stop it waiting for one. */
export async function assignPendingOwner(organizationId: string, userId: string) {
  await db.membership.create({
    data: {
      userId,
      organizationId,
      role: "OWNER",
      acceptedAt: new Date(),
    },
  });

  await db.organization.update({
    where: { id: organizationId },
    data: { pendingOwnerEmail: null },
  });
}

/**
 * An active dealership, with its subscription and plan. Suspended and deleted
 * ones are not found — a storefront is a public page (car/visibility.ts).
 */
export async function findActiveOrganizationBySlug(slug: string) {
  return db.organization.findUnique({
    where: { slug, ...PUBLIC_DEALERSHIP_WHERE },
    include: WITH_PLAN,
  });
}

export async function findActiveOrganizationById(id: string) {
  return db.organization.findUnique({
    where: { id, ...PUBLIC_DEALERSHIP_WHERE },
    include: WITH_PLAN,
  });
}

/** The user's membership of the dealership, alone. */
export async function findMembershipRow(userId: string, organizationId: string) {
  return db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  });
}

/** The user's membership of the dealership, with the dealership's plan. */
export async function findMembershipWithOrganization(userId: string, organizationId: string) {
  return db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    include: {
      organization: {
        include: WITH_PLAN,
      },
    },
  });
}

/** Every dealership the user belongs to, by name, with its plan. */
export async function findMembershipsWithOrganizations(userId: string) {
  return db.membership.findMany({
    where: { userId },
    include: {
      organization: {
        include: WITH_PLAN,
      },
    },
    orderBy: {
      organization: { name: "asc" },
    },
  });
}
