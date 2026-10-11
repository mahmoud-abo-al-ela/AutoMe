import type { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

export interface ImpersonationSessionFilters {
  superAdminId?: string;
  targetOrganizationId?: string;
  activeOnly?: boolean;
  startDate?: Date | string;
  endDate?: Date | string;
}

/**
 * Get all impersonation sessions (for Super Admin view)
 */
export async function getImpersonationSessions({
  filters = {},
  pagination = { page: 1, limit: 50 },
}: {
  filters?: ImpersonationSessionFilters;
  pagination?: { page: number; limit: number };
}) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const where: Prisma.ImpersonationSessionWhereInput = {
    ...(filters.superAdminId && { superAdminId: filters.superAdminId }),
    ...(filters.targetOrganizationId && { targetOrganizationId: filters.targetOrganizationId }),
    ...(filters.activeOnly && { endedAt: null }),
    ...(filters.startDate && filters.endDate && {
      startedAt: {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      },
    }),
  };

  const [sessions, total] = await Promise.all([
    db.impersonationSession.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip,
      take: limit,
      include: {
        superAdmin: {
          select: { id: true, name: true, email: true },
        },
        targetUser: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    db.impersonationSession.count({ where }),
  ]);

  // Get organization names
  const orgIds = [...new Set(sessions.map(s => s.targetOrganizationId))];
  const organizations = await db.organization.findMany({
    where: { id: { in: orgIds } },
    select: { id: true, name: true, slug: true },
  });
  const orgMap = Object.fromEntries(organizations.map(o => [o.id, o]));

  const sessionsWithOrg = sessions.map(s => ({
    ...s,
    targetOrganization: orgMap[s.targetOrganizationId],
  }));

  return {
    sessions: sessionsWithOrg,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/** Sessions not ended that started at or after `since` — the service says how long a session lasts. */
export async function countOpenSessionsStartedSince(since: Date) {
  return db.impersonationSession.count({
    where: {
      endedAt: null,
      startedAt: { gte: since },
    },
  });
}

export async function createImpersonationSession(data: Prisma.ImpersonationSessionUncheckedCreateInput) {
  return db.impersonationSession.create({ data });
}

export async function endImpersonationSession(sessionId: string, endedAt: Date) {
  return db.impersonationSession.update({
    where: { id: sessionId },
    data: { endedAt },
  });
}

/** A session with the admin running it and the member they are signed in as. */
export async function findSessionWithParticipants(sessionId: string) {
  return db.impersonationSession.findUnique({
    where: { id: sessionId },
    include: {
      superAdmin: {
        select: { id: true, name: true, email: true },
      },
      targetUser: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

/** The super-admin behind a support session, or undefined if there is no such session. */
export async function findSessionSuperAdminId(sessionId: string) {
  const session = await db.impersonationSession.findUnique({
    where: { id: sessionId },
    select: { superAdminId: true },
  });
  return session?.superAdminId;
}
