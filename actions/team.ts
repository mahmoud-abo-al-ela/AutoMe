"use server";

import { revalidateLocalized } from "@/lib/utils/revalidate";
import * as teamService from "@/lib/services/team";
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

export const inviteTeamMember = withOrgAuth(
  withUsageLimit("members", async (ctx, input) => {
    await enforceRateLimit();
    // organizationId in the payload is ignored for security; we always use
    // ctx.organization.id.
    const { email, role } = validateAction(inviteTeamMemberSchema, input);

    await teamService.inviteTeamMember(ctx.user, ctx.organization.id, { email, role });

    revalidateLocalized(`/org/${ctx.organization.slug}/settings/team`);
    return createSuccessResponse(null, "Team member invited successfully");
  })
);

export const updateMemberRole = withOrgAuth(async (ctx, input) => {
  const { memberId, newRole } = validateAction(updateMemberRoleSchema, input);

  await teamService.changeMemberRole(ctx.user, ctx.organization.id, { memberId, newRole });

  revalidateLocalized(`/org/${ctx.organization.slug}/settings/team`);
  return createSuccessResponse(null, "Member role updated successfully");
});

export const removeMember = withOrgAuth(async (ctx, input) => {
  const { memberId } = validateAction(memberIdSchema, input);

  await teamService.removeTeamMember(ctx.user, ctx.organization.id, memberId);

  revalidateLocalized(`/org/${ctx.organization.slug}/settings/team`);
  return createSuccessResponse(null, "Member removed successfully");
});
