import type { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

/** Write one audit log row; the service decides what goes in it. */
export async function createAuditLogEntry(data: Prisma.AuditLogUncheckedCreateInput) {
  return db.auditLog.create({ data });
}

/**
 * How many days a dealership's plan keeps its audit log; null or undefined
 * when the plan keeps it forever, or the dealership has no subscription.
 */
export async function findAuditRetentionDays(organizationId: string) {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscription: {
        include: { plan: true },
      },
    },
  });
  return org?.subscription?.plan?.auditLogRetentionDays;
}
