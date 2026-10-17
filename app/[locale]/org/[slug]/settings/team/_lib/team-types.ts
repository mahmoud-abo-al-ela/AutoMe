import type { getTeamMembersService } from "@/lib/services/team";

export type TeamMember = Awaited<
  ReturnType<typeof getTeamMembersService>
>[number];

export type TeamMemberRole = TeamMember["role"];
