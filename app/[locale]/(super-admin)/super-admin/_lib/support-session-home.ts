import type { CurrentUser } from "@/lib/checkUser";

/**
 * Where an admin in a support session belongs: the dashboard of the dealership
 * the session is for. Null outside a session, or if that membership is gone.
 */
export function supportSessionHome(user: CurrentUser, locale: string): string | null {
  const session = user.impersonation;
  if (!session) return null;
  const membership = user.memberships.find((m) => m.organizationId === session.targetOrganizationId);
  return membership ? `/${locale}/org/${membership.organization.slug}/dashboard` : null;
}
