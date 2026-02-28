"use server";

import { db } from "@/lib/prisma";
import {
  getCurrentOrganization,
  getUserMembership,
} from "@/lib/getOrganization";
import { revalidatePath } from "next/cache";
import { auditHelpers } from "@/lib/services/audit/audit";
import { withAuth } from "@/lib/middleware/with-auth";
import { createSuccessResponse } from "@/lib/utils/response";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ConflictError,
} from "@/lib/utils/errors";

export const inviteTeamMember = withAuth(
  async (ctx, { organizationId, email, role }) => {
    const organization = await getCurrentOrganization();
    if (!organization || organization.id !== organizationId) {
      throw new NotFoundError("Organization");
    }

    // Check if user has permission (only OWNER can invite)
    const membership = await getUserMembership(ctx.user.id, organizationId);
    if (!membership || membership.role !== "OWNER") {
      throw new AuthorizationError(
        "You don't have permission to invite members"
      );
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
      throw new ValidationError(
        "Member limit reached. Upgrade your plan to add more members."
      );
    }

    // Check if user exists
    const invitedUser = await db.user.findUnique({
      where: { email },
    });

    if (!invitedUser) {
      throw new NotFoundError(
        "User not found. They need to create an account first."
      );
    }

    // Check if already a member
    const existingMembership = await db.membership.findFirst({
      where: {
        userId: invitedUser.id,
        organizationId,
      },
    });

    if (existingMembership) {
      throw new ConflictError("This user is already a member");
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
    await auditHelpers.logMemberInvited(
      newMembership,
      ctx.user.id,
      ctx.user.email
    );

    revalidatePath("/admin/team");

    return createSuccessResponse(null, "Team member invited successfully");
  }
);

export const updateMemberRole = withAuth(
  async (ctx, { organizationId, memberId, newRole }) => {
    const organization = await getCurrentOrganization();
    if (!organization || organization.id !== organizationId) {
      throw new NotFoundError("Organization");
    }

    // Check if user has permission (only OWNER can change roles)
    const currentMembership = await getUserMembership(
      ctx.user.id,
      organizationId
    );
    if (!currentMembership || currentMembership.role !== "OWNER") {
      throw new AuthorizationError(
        "You don't have permission to change roles"
      );
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
      throw new NotFoundError("Member");
    }

    // Cannot change owner role
    if (targetMembership.role === "OWNER") {
      throw new AuthorizationError("Cannot change the owner's role");
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
      ctx.user.id,
      ctx.user.email
    );

    revalidatePath("/admin/team");

    return createSuccessResponse(null, "Member role updated successfully");
  }
);

export const removeMember = withAuth(
  async (ctx, { organizationId, memberId }) => {
    const organization = await getCurrentOrganization();
    if (!organization || organization.id !== organizationId) {
      throw new NotFoundError("Organization");
    }

    // Check if user has permission (only OWNER can remove members)
    const currentMembership = await getUserMembership(
      ctx.user.id,
      organizationId
    );
    if (!currentMembership || currentMembership.role !== "OWNER") {
      throw new AuthorizationError(
        "You don't have permission to remove members"
      );
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
      throw new NotFoundError("Member");
    }

    // Cannot remove owner
    if (targetMembership.role === "OWNER") {
      throw new AuthorizationError("Cannot remove the owner");
    }

    // Cannot remove yourself
    if (targetMembership.userId === ctx.user.id) {
      throw new ValidationError("Cannot remove yourself");
    }

    // Audit log before deletion
    await auditHelpers.logMemberRemoved(
      targetMembership,
      ctx.user.id,
      ctx.user.email
    );

    // Remove membership
    await db.membership.delete({
      where: { id: memberId },
    });

    revalidatePath("/admin/team");

    return createSuccessResponse(null, "Member removed successfully");
  }
);
