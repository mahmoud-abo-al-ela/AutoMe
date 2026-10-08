import { db } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

/**
 * Data access for the super-admin Activity page: audit entries across every
 * dealership, with who made each one and where.
 */

export async function findEntries({ where, skip, take }: { where: Prisma.AuditLogWhereInput; skip?: number; take: number }) {
  return db.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: {
      user: { select: { id: true, name: true, email: true, role: true, memberships: { select: { organizationId: true } } } },
      organization: { select: { id: true, name: true } },
    },
  });
}

export async function countEntries(where: Prisma.AuditLogWhereInput) {
  return db.auditLog.count({ where });
}

/** Every dealership, for the filter. */
export async function findDealershipNames() {
  return db.organization.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
}
