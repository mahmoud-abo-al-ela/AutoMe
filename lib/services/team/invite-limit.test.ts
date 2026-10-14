import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlanLimitError } from "@/lib/utils/errors";

const teamRepo = vi.hoisted(() => ({ findUserByEmail: vi.fn(), findMembership: vi.fn(), createMembershipWithinLimit: vi.fn() }));
vi.mock("@/lib/repositories/team", () => teamRepo);
vi.mock("@/lib/repositories/billing/queries", () => ({}));
const org = vi.hoisted(() => ({ getUserMembership: vi.fn(), getOrganizationById: vi.fn() }));
vi.mock("@/lib/getOrganization", () => org);
const planInEffect = vi.hoisted(() => vi.fn());
vi.mock("@/lib/services/billing/entitlements", () => ({ planInEffect }));
const logMemberInvited = vi.hoisted(() => vi.fn());
vi.mock("@/lib/services/audit/audit", () => ({ auditHelpers: { logMemberInvited } }));

import { inviteTeamMember } from "@/lib/services/team";

/** The member limit is decided at the insert, under the dealership's lock. */

const actor = { id: "owner-1", email: "o@x.eg" };

beforeEach(() => {
  vi.clearAllMocks();
  org.getUserMembership.mockResolvedValue({ role: "OWNER" });
  org.getOrganizationById.mockResolvedValue({ id: "org-1", slug: "dealer", subscription: {} });
  planInEffect.mockResolvedValue({ name: "Starter", maxMembers: 2 });
  teamRepo.findUserByEmail.mockResolvedValue({ id: "user-2" });
  teamRepo.findMembership.mockResolvedValue(null);
});

describe("inviteTeamMember at the plan's member limit", () => {
  it("passes the plan in effect's limit to the locked insert", async () => {
    teamRepo.createMembershipWithinLimit.mockResolvedValue({ id: "m-2", userId: "user-2", organizationId: "org-1", role: "MEMBER" });
    await inviteTeamMember(actor, "org-1", { email: "u2@x.eg", role: "MEMBER" });
    expect(teamRepo.createMembershipWithinLimit).toHaveBeenCalledWith({ userId: "user-2", organizationId: "org-1", role: "MEMBER" }, 2);
  });

  it("refuses when another invite took the last seat, and logs no invite", async () => {
    teamRepo.createMembershipWithinLimit.mockResolvedValue(null);
    await expect(inviteTeamMember(actor, "org-1", { email: "u2@x.eg", role: "MEMBER" })).rejects.toBeInstanceOf(PlanLimitError);
    expect(logMemberInvited).not.toHaveBeenCalled();
  });
});
