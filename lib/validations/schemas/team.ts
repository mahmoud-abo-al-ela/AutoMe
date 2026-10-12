import { z } from "zod";

export const inviteTeamMemberSchema = z.object({
  // Kept for backward-compatible call sites; the action always uses ctx.organization.id.
  organizationId: z.string().optional(),
  email: z.string().trim().email("Invalid email address").max(120),
  role: z.enum(["OWNER", "MEMBER"]),
});

export const updateMemberRoleSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  newRole: z.enum(["OWNER", "MEMBER"]),
});

export const memberIdSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
});

export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type MemberIdInput = z.infer<typeof memberIdSchema>;
