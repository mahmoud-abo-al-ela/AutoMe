// Impersonation repository - Data access for super-admin support sessions.
import { db } from "@/lib/prisma";

/** The super-admin behind a support session, or undefined if there is no such session. */
export async function findSessionSuperAdminId(sessionId: string) {
  const session = await db.impersonationSession.findUnique({
    where: { id: sessionId },
    select: { superAdminId: true },
  });
  return session?.superAdminId;
}
