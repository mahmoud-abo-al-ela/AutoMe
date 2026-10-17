import * as userRepository from "@/lib/repositories/user";
import { AuthenticationError, AuthorizationError } from "@/lib/utils/errors";
import { isImpersonatingOrganization } from "@/lib/services/impersonation/active";

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
