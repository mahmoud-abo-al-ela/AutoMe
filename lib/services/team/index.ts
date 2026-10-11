import type { MemberRole } from "@/lib/generated/prisma";
import * as teamRepo from "@/lib/repositories/team";
import * as billingRepo from "@/lib/repositories/billing/queries";
import { auditHelpers } from "@/lib/services/audit/audit";
import { getUserMembership } from "@/lib/getOrganization";
import { AuthorizationError, ConflictError, NotFoundError, ValidationError } from "@/lib/utils/errors";

/** The signed-in member doing the change, as the audit log records them. */
export interface TeamActor {
  id: string;
  email: string | null;
}

/** Only a dealership's owner manages its team. */
async function assertOwner(actor: TeamActor, organizationId: string, message: string) {
  const membership = await getUserMembership(actor.id, organizationId);
  if (!membership || membership.role !== "OWNER") {
    throw new AuthorizationError(message);
  }
}

/** A membership of this dealership, or NotFound — an id from another tenant is not found, not forbidden. */
async function memberOf(organizationId: string, memberId: string) {
  const membership = await teamRepo.findMembershipById(memberId);
  if (!membership || membership.organizationId !== organizationId) {
    throw new NotFoundError("Member");
  }
  return membership;
}

/** Add an existing user to the dealership's team. */
export async function inviteTeamMember(
  actor: TeamActor,
  organizationId: string,
  { email, role }: { email: string; role: MemberRole }
) {
  await assertOwner(actor, organizationId, "You don't have permission to invite members");

  const invitedUser = await teamRepo.findUserByEmail(email);
  if (!invitedUser) {
    throw new NotFoundError("User not found. They need to create an account first.");
  }

  if (await teamRepo.findMembership(invitedUser.id, organizationId)) {
    throw new ConflictError("This user is already a member");
  }

  const membership = await teamRepo.createMembership({ userId: invitedUser.id, organizationId, role });
  await auditHelpers.logMemberInvited(membership, actor.id, actor.email);
}

/** Change a member's role. The owner's role never changes. */
export async function changeMemberRole(
  actor: TeamActor,
  organizationId: string,
  { memberId, newRole }: { memberId: string; newRole: MemberRole }
) {
  await assertOwner(actor, organizationId, "You don't have permission to change roles");

  const target = await memberOf(organizationId, memberId);
  if (target.role === "OWNER") {
    throw new AuthorizationError("Cannot change the owner's role");
  }

  const updated = await teamRepo.updateMembership(memberId, { role: newRole });
  await auditHelpers.logMemberRoleChanged(updated, target.role, actor.id, actor.email);
}

/** Remove a member. Neither the owner nor the owner themself can be removed. */
export async function removeTeamMember(actor: TeamActor, organizationId: string, memberId: string) {
  await assertOwner(actor, organizationId, "You don't have permission to remove members");

  const target = await memberOf(organizationId, memberId);
  if (target.role === "OWNER") {
    throw new AuthorizationError("Cannot remove the owner");
  }
  if (target.userId === actor.id) {
    throw new ValidationError("Cannot remove yourself", null, { key: "errors.team.cannotRemoveSelf" });
  }

  // Logged before the row is gone, while it can still be described.
  await auditHelpers.logMemberRemoved(target, actor.id, actor.email);
  await teamRepo.deleteMembership(memberId);
}

const PLAN_LIMITS = {
  STARTER: 3,
  PRO: 10,
  ENTERPRISE: -1,
};

/**
 * Get team members for an organization
 */
export async function getTeamMembersService(organizationId: string) {
  return teamRepo.findManyMembers(organizationId);
}

/**
 * Get subscription details for an organization
 */
export async function getSubscriptionDetailsService(organizationId: string) {
  return billingRepo.findActiveSubscription(organizationId);
}


