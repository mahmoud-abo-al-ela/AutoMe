import * as teamRepo from "@/lib/repositories/team";
import * as billingRepo from "@/lib/repositories/billing/queries";
import { auditHelpers } from "@/lib/services/audit/audit";

const PLAN_LIMITS = {
  STARTER: 3,
  PRO: 10,
  ENTERPRISE: -1,
};

/**
 * Get team members for an organization
 */
export async function getTeamMembersService(organizationId) {
  return teamRepo.findManyMembers(organizationId);
}

/**
 * Get subscription details for an organization
 */
export async function getSubscriptionDetailsService(organizationId) {
  return billingRepo.findActiveSubscription(organizationId);
}

/**
 * Invite a new member to the team
 */
export async function inviteMemberService({
  organizationId,
  email,
  role,
  inviterId,
  inviterEmail,
}) {
  // Check permission
  const membership = await teamRepo.findMembership(inviterId, organizationId);
  if (!membership || membership.role !== "OWNER") {
    throw new Error("You don't have permission to invite members");
  }

  // Check plan limits
  const memberCount = await teamRepo.countMembers(organizationId);
  const subscription = await billingRepo.findActiveSubscription(organizationId);
  
  const currentPlan = subscription?.plan?.type || "STARTER";
  const limit = PLAN_LIMITS[currentPlan];

  if (limit !== -1 && memberCount >= limit) {
    throw new Error(
      "Member limit reached. Upgrade your plan to add more members."
    );
  }

  // Check if user exists
  const invitedUser = await teamRepo.findUserByEmail(email);
  if (!invitedUser) {
    throw new Error("User not found. They need to create an account first.");
  }

  // Check if already a member
  const existingMembership = await teamRepo.findMembership(
    invitedUser.id,
    organizationId
  );
  if (existingMembership) {
    throw new Error("This user is already a member");
  }

  // Create membership
  const newMembership = await teamRepo.createMembership({
    userId: invitedUser.id,
    organizationId,
    role,
  });

  // Audit log
  await auditHelpers.logMemberInvited(
    newMembership,
    inviterId,
    inviterEmail
  );

  return newMembership;
}

/**
 * Update a member's role
 */
export async function updateMemberRoleService({
  organizationId,
  memberId,
  newRole,
  updaterId,
  updaterEmail,
}) {
  // Check permission
  const currentMembership = await teamRepo.findMembership(
    updaterId,
    organizationId
  );
  if (!currentMembership || currentMembership.role !== "OWNER") {
    throw new Error("You don't have permission to change roles");
  }

  // Get target membership
  const targetMembership = await teamRepo.findMembershipById(memberId);
  if (
    !targetMembership ||
    targetMembership.organizationId !== organizationId
  ) {
    throw new Error("Member not found");
  }

  if (targetMembership.role === "OWNER") {
    throw new Error("Cannot change the owner's role");
  }

  const oldRole = targetMembership.role;

  // Update role
  const updatedMembership = await teamRepo.updateMembership(memberId, {
    role: newRole,
  });

  // Audit log
  await auditHelpers.logMemberRoleChanged(
    updatedMembership,
    oldRole,
    updaterId,
    updaterEmail
  );

  return updatedMembership;
}

/**
 * Remove a member from the team
 */
export async function removeMemberService({
  organizationId,
  memberId,
  removerId,
  removerEmail,
}) {
  // Check permission
  const currentMembership = await teamRepo.findMembership(
    removerId,
    organizationId
  );
  if (!currentMembership || currentMembership.role !== "OWNER") {
    throw new Error("You don't have permission to remove members");
  }

  // Get target membership
  const targetMembership = await teamRepo.findMembershipById(memberId);
  if (
    !targetMembership ||
    targetMembership.organizationId !== organizationId
  ) {
    throw new Error("Member not found");
  }

  if (targetMembership.role === "OWNER") {
    throw new Error("Cannot remove the owner");
  }

  if (targetMembership.userId === removerId) {
    throw new Error("Cannot remove yourself");
  }

  // Audit log before deletion
  await auditHelpers.logMemberRemoved(
    targetMembership,
    removerId,
    removerEmail
  );

  // Remove membership
  await teamRepo.deleteMembership(memberId);

  return true;
}
