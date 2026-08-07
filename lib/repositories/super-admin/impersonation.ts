import { db } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";

/**
 * Impersonation repository for Super Admin operations
 */

export async function createImpersonationSession(data: Prisma.ImpersonationSessionUncheckedCreateInput) {
  return db.impersonationSession.create({
    data,
    include: {
      organization: true,
    },
  });
}

export async function updateImpersonationSession(sessionId: string, data: Prisma.ImpersonationSessionUncheckedUpdateInput) {
  return db.impersonationSession.update({
    where: { id: sessionId },
    data,
  });
}

export async function endImpersonationSession(sessionId: string) {
  return db.impersonationSession.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
  });
}
