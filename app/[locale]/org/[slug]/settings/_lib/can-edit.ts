import { checkUser } from "@/lib/checkUser";
import { getOrganizationBySlug, getUserMembership } from "@/lib/getOrganization";

/**
 * Whether the viewer may change this dealership's settings: its owners, and
 * site admins — the same rule the settings actions enforce. Only decides what
 * the page offers; the actions still check for themselves.
 */
export async function canEditSettings(slug: string) {
  const [user, organization] = await Promise.all([checkUser(), getOrganizationBySlug(slug)]);
  if (!user || !organization) return false;
  if (user.role === "ADMIN") return true;
  const membership = await getUserMembership(user.id, organization.id);
  return membership?.role === "OWNER";
}
