import { checkUser } from "@/lib/checkUser";
import { getOrganizationBySlug, getUserMembership } from "@/lib/getOrganization";

/**
 * Whether the viewer may change this dealership's settings: its owners, and
 * an admin in a verified support session for this dealership — the same rule
 * the settings actions enforce. Only decides what the page offers; the actions
 * still check for themselves.
 */
export async function canEditSettings(slug: string) {
  const [user, organization] = await Promise.all([checkUser(), getOrganizationBySlug(slug)]);
  if (!user || !organization) return false;
  if (user.impersonation?.targetOrganizationId === organization.id) return true;
  const membership = await getUserMembership(user.id, organization.id);
  return membership?.role === "OWNER";
}
