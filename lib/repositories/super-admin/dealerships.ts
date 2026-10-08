import { db } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

/**
 * The super-admin dealerships list: every dealership across the platform, by
 * design — only platform admins reach it. Soft-deleted ones never show.
 */

export const dealershipListSelect = {
  id: true,
  name: true,
  slug: true,
  logo: true,
  email: true,
  phone: true,
  city: true,
  region: true,
  isActive: true,
  createdAt: true,
  subscription: {
    select: {
      status: true,
      currentPeriodEnd: true,
      pastDueSince: true,
      plan: { select: { type: true, name: true } },
    },
  },
  _count: { select: { cars: true, memberships: true } },
} satisfies Prisma.OrganizationSelect;

export type DealershipListRow = Prisma.OrganizationGetPayload<{ select: typeof dealershipListSelect }>;

export async function findDealerships(args: {
  where: Prisma.OrganizationWhereInput;
  orderBy: Prisma.OrganizationOrderByWithRelationInput[];
  skip?: number;
  take: number;
}) {
  return db.organization.findMany({ ...args, select: dealershipListSelect });
}

export async function countDealerships(where: Prisma.OrganizationWhereInput) {
  return db.organization.count({ where });
}

/** Test drives requested at each dealership since `since`. */
export async function countRecentTestDrives(organizationIds: string[], since: Date) {
  if (organizationIds.length === 0) return new Map<string, number>();
  const rows = await db.testDrive.groupBy({
    by: ["organizationId"],
    where: { organizationId: { in: organizationIds }, createdAt: { gte: since } },
    _count: { _all: true },
  });
  return new Map(rows.map((row) => [row.organizationId, row._count._all]));
}

/** What each dealership has paid AutoMe so far, in piasters. */
export async function sumPaidPayments(organizationIds: string[]) {
  if (organizationIds.length === 0) return new Map<string, number>();
  const rows = await db.payment.groupBy({
    by: ["organizationId"],
    where: { organizationId: { in: organizationIds }, status: "PAID" },
    _sum: { amountCents: true },
  });
  return new Map(rows.flatMap((row) => (row.organizationId ? [[row.organizationId, row._sum.amountCents ?? 0] as const] : [])));
}
