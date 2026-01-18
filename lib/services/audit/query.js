import { db } from "@/lib/prisma";

/**
 * Get audit logs for an organization with filtering and pagination
 */
export async function getAuditLogs({
  organizationId,
  filters = {},
  pagination = { page: 1, limit: 50 },
}) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    organizationId,
    ...(filters.action && { action: filters.action }),
    ...(filters.entityType && { entityType: filters.entityType }),
    ...(filters.entityId && { entityId: filters.entityId }),
    ...(filters.userId && { userId: filters.userId }),
    ...(filters.startDate && filters.endDate && {
      createdAt: {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      },
    }),
  };

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            imageUrl: true,
          },
        },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get all audit logs (for Super Admin)
 */
export async function getAllAuditLogs({
  filters = {},
  pagination = { page: 1, limit: 50 },
}) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where = {
    ...(filters.organizationId && { organizationId: filters.organizationId }),
    ...(filters.action && { action: filters.action }),
    ...(filters.entityType && { entityType: filters.entityType }),
    ...(filters.userId && { userId: filters.userId }),
    ...(filters.startDate && filters.endDate && {
      createdAt: {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      },
    }),
    // Filter for impersonated actions only
    ...(filters.impersonatedOnly && {
      impersonatedBy: { not: null },
    }),
  };

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        organization: {
          select: { name: true, slug: true },
        },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Delete expired audit logs (run via cron job)
 */
export async function cleanupExpiredAuditLogs() {
  const now = new Date();

  const result = await db.auditLog.deleteMany({
    where: {
      retainUntil: {
        not: null,
        lt: now,
      },
    },
  });

  console.log(`[Audit Cleanup] Deleted ${result.count} expired audit logs`);
  return result.count;
}
