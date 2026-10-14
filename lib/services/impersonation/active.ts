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

/**
 * The caller's support session, verified against its row — or null.
 *
 * The cookie carries only the session id; it is never authority on its own.
 * Anyone can send any cookie, so the row decides: the session must be open,
 * within its lifetime, and run by the platform admin who is signed in on this
 * request. Who is impersonated and where come from the row, not the cookie.
 *
 * Nothing is memoized. `React.cache()` does not memoize outside a render
 * (Route Handlers, parts of Server Actions), and a module-level memo would
 * carry one request's answer into another. Callers without the cookie — every
 * buyer and dealer — never reach the database here.
 */
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

/**
 * Whether the caller is in a verified support session for exactly this
 * dealership. The only way, besides a membership, to act inside a tenant: a
 * platform role alone grants nothing there, and a session for one dealership
 * grants nothing in another.
 */
export async function isImpersonatingOrganization(organizationId: string): Promise<boolean> {
  const session = await resolveActiveImpersonation();
  return session?.targetOrganizationId === organizationId;
}
