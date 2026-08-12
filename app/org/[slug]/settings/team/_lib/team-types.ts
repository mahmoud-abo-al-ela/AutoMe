import type { getTeamMembersService } from "@/lib/services/team";

/**
 * A membership row as the team page loads it — including the selected user
 * fields. Derived from the service so a change to the query's `include`
 * surfaces here rather than as a runtime `undefined`.
 */
export type TeamMember = Awaited<
  ReturnType<typeof getTeamMembersService>
>[number];

export type TeamMemberRole = TeamMember["role"];
