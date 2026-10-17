import { auth } from "@clerk/nextjs/server";
import * as impersonationRepo from "@/lib/repositories/impersonation";
import { getSessionIdFromCookies } from "./cookie";

/** A support session ends on its own this long after it starts. */
export const SESSION_LIFETIME_MS = 4 * 60 * 60 * 1000;

export const lifetimeStart = () => new Date(Date.now() - SESSION_LIFETIME_MS);

/** A support session the database says is running now, for the admin making this request. */
export interface ActiveImpersonation {
  sessionId: string;
  superAdmin: { id: string; email: string | null; name: string | null };
  targetUserId: string;
  targetOrganizationId: string;
}

export async function resolveActiveImpersonation(): Promise<ActiveImpersonation | null> {
  const sessionId = await getSessionIdFromCookies();
  if (!sessionId) return null;

  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const session = await impersonationRepo.findSessionForAuthorization(sessionId);
  if (!session) return null;
  if (session.endedAt) return null;
  if (session.startedAt < lifetimeStart()) return null;
  if (session.superAdmin.clerkId !== clerkId) return null;
  if (session.superAdmin.role !== "ADMIN") return null;

  return {
    sessionId: session.id,
    superAdmin: { id: session.superAdmin.id, email: session.superAdmin.email, name: session.superAdmin.name },
    targetUserId: session.targetUserId,
    targetOrganizationId: session.targetOrganizationId,
  };
}

// Besides a membership, the only way to act inside a tenant; a platform role alone grants nothing there.
export async function isImpersonatingOrganization(organizationId: string): Promise<boolean> {
  const session = await resolveActiveImpersonation();
  return session?.targetOrganizationId === organizationId;
}
