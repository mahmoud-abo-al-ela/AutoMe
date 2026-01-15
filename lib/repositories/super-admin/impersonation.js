import { db } from "@/lib/prisma";

/**
 * Impersonation repository for Super Admin operations
 */

export async function createImpersonationSession(data) {
  return db.impersonationSession.create({
    data,
    include: {
      organization: true,
    },
  });
}

export async function updateImpersonationSession(sessionId, data) {
  return db.impersonationSession.update({
    where: { id: sessionId },
    data,
  });
}

export async function endImpersonationSession(sessionId) {
  return db.impersonationSession.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
  });
}
