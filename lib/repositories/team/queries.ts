import type { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

/**
 * Find all members in an organization
 */
export async function findManyMembers(organizationId: string) {
  return db.membership.findMany({
    where: {
      organizationId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
}

/**
 * One page of a dealership's members, newest first, optionally searched by
 * name or email, with the total.
 */
export async function findMembersPage({
  organizationId,
  search,
  skip,
  take,
}: {
  organizationId: string;
  search?: string | null;
  skip: number;
  take: number;
}) {
  const where: Prisma.MembershipWhereInput = {
    organizationId,
    ...(search && {
      user: {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
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
      take,
    }),
    db.membership.count({ where }),
  ]);
  return { memberships, total };
}

/**
 * A dealership's members with the user's public fields, owners first — the
 * shape the super-admin's "sign in as" picker reads.
 */
export async function findMembersWithUserCard(organizationId: string) {
  return db.membership.findMany({
    where: { organizationId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
        },
      },
    },
    orderBy: [
      { role: "asc" }, // OWNER first, then ADMIN, then MEMBER
      { createdAt: "asc" },
    ],
  });
}

/** The user ids of a dealership's members. */
export async function findMemberUserIds(organizationId: string) {
  const memberships = await db.membership.findMany({
    where: { organizationId },
    select: { userId: true },
  });
  return memberships.map((m) => m.userId);
}

/** The dealership owner's name and email, or null when it has no owner. */
export async function findOwnerContact(organizationId: string) {
  const ownerMembership = await db.membership.findFirst({
    where: {
      organizationId,
      role: "OWNER",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return ownerMembership?.user || null;
}

/**
 * Find membership by user and organization
 */
export async function findMembership(userId: string, organizationId: string) {
  return db.membership.findFirst({
    where: {
      userId,
      organizationId,
    },
  });
}

/** A membership with its user and organization, by the user–organization pair. */
export async function findMembershipWithUserAndOrganization(userId: string, organizationId: string) {
  return db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    include: {
      user: true,
      organization: true,
    },
  });
}

/**
 * Find membership by ID
 */
export async function findMembershipById(id: string) {
  return db.membership.findUnique({
    where: { id },
    include: { user: true },
  });
}

/**
 * Count members in an organization
 */
export async function countMembers(organizationId: string) {
  return db.membership.count({
    where: { organizationId },
  });
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
  });
}
