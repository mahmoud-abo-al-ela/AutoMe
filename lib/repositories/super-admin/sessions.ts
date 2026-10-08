import { db } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

/**
 * Support sessions for the super-admin: every time AutoMe staff signed in as
 * someone at a dealership. Only platform admins reach it.
 */

export async function findSessions(args: { where: Prisma.ImpersonationSessionWhereInput; skip: number; take: number }) {
  return db.impersonationSession.findMany({
    ...args,
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      reason: true,
      startedAt: true,
      endedAt: true,
      superAdmin: { select: { id: true, name: true, email: true } },
      targetUser: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true, slug: true } },
    },
  });
}

export async function countSessions(where: Prisma.ImpersonationSessionWhereInput) {
  return db.impersonationSession.count({ where });
}

/**
 * Changes made during one support session. Every entry written while signed
 * in records the session it belongs to; the session's own start and end
 * entries are left out.
 */
export async function countChangesDuring(sessionId: string) {
  return db.auditLog.count({
    where: {
      metadata: { path: ["impersonationSessionId"], equals: sessionId },
      entityType: { not: "IMPERSONATION_SESSION" },
    },
  });
}

/** The admins who have started a session, for the filter. */
export async function findSessionAdmins() {
  return db.user.findMany({
    where: { superAdminSessions: { some: {} } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
}

/** Active dealerships, for picking where to start a session. */
export async function findActiveDealerships() {
  return db.organization.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}
