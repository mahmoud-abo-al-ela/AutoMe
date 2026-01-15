"use server";

import { checkUser } from "@/lib/checkUser";
import { db } from "@/lib/prisma";
import {
  getCurrentOrganization,
  getUserMembership,
} from "@/lib/getOrganization";
import { revalidatePath } from "next/cache";
import { auditHelpers } from "@/lib/services/audit/audit";

export async function inviteTeamMember({ organizationId, email, role }) {
  try {
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const organization = await getCurrentOrganization();
    if (!organization || organization.id !== organizationId) {
      return { success: false, error: "Organization not found" };
    }

    // Check if user has permission (only OWNER can invite)
    const membership = await getUserMembership(user.id, organizationId);
    if (!membership || membership.role !== "OWNER") {
      return {
        success: false,
        error: "You don't have permission to invite members",
      };
    }

    // Check plan limits
    const memberCount = await db.membership.count({
      where: { organizationId },
    });

    const subscription = await db.subscription.findFirst({
      where: {
        organizationId,
        status: { in: ["ACTIVE", "TRIALING"] },
      },
      include: { plan: true },
    });

    const planLimits = {
      STARTER: 3,
      PRO: 10,
      ENTERPRISE: -1,
    };

    const limit = planLimits[subscription?.plan?.type || "STARTER"];
    if (limit !== -1 && memberCount >= limit) {
      return {
        success: false,
        error: "Member limit reached. Upgrade your plan to add more members.",
      };
    }

    // Check if user exists
    const invitedUser = await db.user.findUnique({
      where: { email },
    });

    if (!invitedUser) {
      // TODO: Send invitation email to new user
      // For now, return an error
      return {
        success: false,
        error: "User not found. They need to create an account first.",
      };
    }

    // Check if already a member
    const existingMembership = await db.membership.findFirst({
      where: {
        userId: invitedUser.id,
        organizationId,
      },
    });

    if (existingMembership) {
      return { success: false, error: "This user is already a member" };
    }

    // Create membership
    const newMembership = await db.membership.create({
      data: {
        userId: invitedUser.id,
        organizationId,
        role,
      },
    });

    // Audit log
    await auditHelpers.logMemberInvited(newMembership, user.id, user.email);

    revalidatePath("/admin/team");

    return { success: true };
  } catch (error) {
    console.error("Error inviting team member:", error);
    return { success: false, error: "Failed to invite team member" };
  }
}

export async function updateMemberRole({ organizationId, memberId, newRole }) {
  try {
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const organization = await getCurrentOrganization();
    if (!organization || organization.id !== organizationId) {
      return { success: false, error: "Organization not found" };
    }

    // Check if user has permission (only OWNER can change roles)
    const currentMembership = await getUserMembership(user.id, organizationId);
    if (!currentMembership || currentMembership.role !== "OWNER") {
      return {
        success: false,
        error: "You don't have permission to change roles",
      };
    }

    // Get the target membership
    const targetMembership = await db.membership.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (
      !targetMembership ||
      targetMembership.organizationId !== organizationId
    ) {
      return { success: false, error: "Member not found" };
    }

    // Cannot change owner role
    if (targetMembership.role === "OWNER") {
      return { success: false, error: "Cannot change the owner's role" };
    }

    const oldRole = targetMembership.role;

    // Update role
    const updatedMembership = await db.membership.update({
      where: { id: memberId },
      data: { role: newRole },
    });

    // Audit log
    await auditHelpers.logMemberRoleChanged(
      updatedMembership,
      oldRole,
      user.id,
      user.email
    );

    revalidatePath("/admin/team");

    return { success: true };
  } catch (error) {
    console.error("Error updating member role:", error);
    return { success: false, error: "Failed to update role" };
  }
}

export async function removeMember({ organizationId, memberId }) {
  try {
    const user = await checkUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const organization = await getCurrentOrganization();
    if (!organization || organization.id !== organizationId) {
      return { success: false, error: "Organization not found" };
    }

    // Check if user has permission (only OWNER can remove members)
    const currentMembership = await getUserMembership(user.id, organizationId);
    if (!currentMembership || currentMembership.role !== "OWNER") {
      return {
        success: false,
        error: "You don't have permission to remove members",
      };
    }

    // Get the target membership
    const targetMembership = await db.membership.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (
      !targetMembership ||
      targetMembership.organizationId !== organizationId
    ) {
      return { success: false, error: "Member not found" };
    }

    // Cannot remove owner
    if (targetMembership.role === "OWNER") {
      return { success: false, error: "Cannot remove the owner" };
    }

    // Cannot remove yourself
    if (targetMembership.userId === user.id) {
      return { success: false, error: "Cannot remove yourself" };
    }

    // Audit log before deletion
    await auditHelpers.logMemberRemoved(targetMembership, user.id, user.email);

    // Remove membership
    await db.membership.delete({
      where: { id: memberId },
    });

    revalidatePath("/admin/team");

    return { success: true };
  } catch (error) {
    console.error("Error removing member:", error);
    return { success: false, error: "Failed to remove member" };
  }
}
