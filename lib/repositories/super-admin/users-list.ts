import { db } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

/**
 * The super-admin users list: every account on the platform, by design —
 * only platform admins reach it.
 */

export const userListSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  imageUrl: true,
  role: true,
  createdAt: true,
  memberships: {
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { role: true, organization: { select: { id: true, name: true, slug: true } } },
  },
  _count: { select: { savedCars: true, testDrives: true } },
} satisfies Prisma.UserSelect;

export type UserListRow = Prisma.UserGetPayload<{ select: typeof userListSelect }>;

export async function findUsers(args: { where: Prisma.UserWhereInput; orderBy: Prisma.UserOrderByWithRelationInput[]; skip?: number; take: number }) {
  return db.user.findMany({ ...args, select: userListSelect });
}

export async function countUsers(where: Prisma.UserWhereInput) {
  return db.user.count({ where });
}

/** The dealerships a team can be filtered by, A to Z. */
export async function findDealershipNames() {
  return db.organization.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
