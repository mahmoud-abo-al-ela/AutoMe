"use server";

import { db } from "@/lib/prisma";
import {
  getUserMembership,
} from "@/lib/getOrganization";
import { revalidatePath } from "next/cache";
import { auditHelpers } from "@/lib/services/audit/audit";
import { withOrgAuth } from "@/lib/middleware/with-auth";
import { withUsageLimit } from "@/lib/middleware/with-usage-limit";
import { enforceRateLimit } from "@/lib/middleware/with-rate-limit";
import { validateAction } from "@/lib/middleware/with-validation";
import {
  inviteTeamMemberSchema,
  updateMemberRoleSchema,
  memberIdSchema,
} from "@/lib/validations/schemas";
import { createSuccessResponse } from "@/lib/utils/response";
import {
  AuthorizationError,
  NotFoundError,
  ValidationError,
  ConflictError,
} from "@/lib/utils/errors";

export const inviteTeamMember = withOrgAuth(
  withUsageLimit("members", async (ctx, input) => {
    await enforceRateLimit();
    // organizationId in the payload is ignored for security; we always use
    // ctx.organization.id.
    const { email, role } = validateAction(inviteTeamMemberSchema, input);

    // Check if user has permission (only OWNER can invite)
    const membership = await getUserMembership(ctx.user.id, ctx.organization.id);
    if (!membership || membership.role !== "OWNER") {
      throw new AuthorizationError(
        "You don't have permission to invite members"
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
        organizationId: ctx.organization.id,
      },
    });

    if (existingMembership) {
      throw new ConflictError("This user is already a member");
    }

    // Create membership
    const newMembership = await db.membership.create({
      data: {
        userId: invitedUser.id,
        organizationId: ctx.organization.id,
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
  })
);

export const updateMemberRole = withOrgAuth(
  async (ctx, input) => {
    const { memberId, newRole } = validateAction(updateMemberRoleSchema, input);

    // Check if user has permission (only OWNER can change roles)
    const currentMembership = await getUserMembership(
      ctx.user.id,
      ctx.organization.id
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
      targetMembership.organizationId !== ctx.organization.id
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

export const removeMember = withOrgAuth(
  async (ctx, input) => {
    const { memberId } = validateAction(memberIdSchema, input);

    // Check if user has permission (only OWNER can remove members)
    const currentMembership = await getUserMembership(
      ctx.user.id,
      ctx.organization.id
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
      targetMembership.organizationId !== ctx.organization.id
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
