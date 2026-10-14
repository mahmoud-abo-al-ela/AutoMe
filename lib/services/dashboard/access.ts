import * as userRepository from "@/lib/repositories/user";
import { AuthenticationError, AuthorizationError } from "@/lib/utils/errors";
import { isImpersonatingOrganization } from "@/lib/services/impersonation/active";

/**
 * The dashboard's one access rule: the caller is a member of the
 * organization, or a platform admin in a verified support session for exactly
 * this organization — the ADMIN role alone is not enough. Every dashboard read
 * runs it first.
 */
export async function verifyAccess(userId: string, organizationId: string) {
  const user = await userRepository.findUserByClerkIdWithMemberships(userId);
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const hasAccess = user.memberships?.some((m) => m.organizationId === organizationId);
  if (!hasAccess && !(await isImpersonatingOrganization(organizationId))) {
    throw new AuthorizationError("You don't have access to this organization");
  }

  return user;
}
