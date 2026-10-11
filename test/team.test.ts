import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

vi.mock("@/lib/services/audit/audit", () => ({
  auditHelpers: { logMemberInvited: vi.fn(), logMemberRoleChanged: vi.fn(), logMemberRemoved: vi.fn() },
}));

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { changeMemberRole, inviteTeamMember, removeTeamMember } from "@/lib/services/team";
import { getUsers } from "@/lib/services/dealership/users";
import { getBillingContact } from "@/lib/services/billing";
import { auditHelpers } from "@/lib/services/audit/audit";
import { db } from "@/lib/prisma";

/**
 * Team management against real Postgres: only the owner manages the team, a
 * member id from another dealership is not found, and the owner can be
 * neither demoted nor removed.
 */

const ORG = "org_test_team_a";
const OTHER_ORG = "org_test_team_b";
const ORGS = [ORG, OTHER_ORG];
const CLERK = { owner: "clerk_test_team_owner", member: "clerk_test_team_member", newcomer: "clerk_test_team_new", other: "clerk_test_team_other" };

const ids = { owner: "", member: "", newcomer: "", other: "", memberMembership: "", otherMembership: "", ownerMembership: "" };
const actor = () => ({ id: ids.owner, email: "team-owner@test.local" });

describe.skipIf(!hasTestDb)("team management (real Postgres)", () => {
  beforeAll(async () => {
    await db.organization.deleteMany({ where: { id: { in: ORGS } } });
    await db.user.deleteMany({ where: { clerkId: { in: Object.values(CLERK) } } });
    await db.organization.createMany({
      data: [
        { id: ORG, name: "Team Motors", slug: "team-test-a", isActive: true },
        { id: OTHER_ORG, name: "Other Team Motors", slug: "team-test-b", isActive: true },
      ],
    });
    for (const [key, clerkId] of Object.entries(CLERK)) {
      const user = await db.user.create({ data: { clerkId, email: `team-${key}@test.local`, name: `Team ${key}` } });
      ids[key as keyof typeof CLERK] = user.id;
    }
    ids.ownerMembership = (await db.membership.create({ data: { userId: ids.owner, organizationId: ORG, role: "OWNER" } })).id;
    ids.memberMembership = (await db.membership.create({ data: { userId: ids.member, organizationId: ORG, role: "MEMBER" } })).id;
    ids.otherMembership = (await db.membership.create({ data: { userId: ids.other, organizationId: OTHER_ORG, role: "MEMBER" } })).id;
  });

  afterAll(async () => {
    await db.organization.deleteMany({ where: { id: { in: ORGS } } });
    await db.user.deleteMany({ where: { clerkId: { in: Object.values(CLERK) } } });
    await db.$disconnect();
  });

  it("lets only the owner invite", async () => {
    const memberActor = { id: ids.member, email: "team-member@test.local" };
    await expect(inviteTeamMember(memberActor, ORG, { email: "team-newcomer@test.local", role: "MEMBER" })).rejects.toThrow("permission");
  });

  it("invites an existing user once, and refuses an unknown email or a second invite", async () => {
    await expect(inviteTeamMember(actor(), ORG, { email: "nobody@test.local", role: "MEMBER" })).rejects.toThrow("User not found");
    await inviteTeamMember(actor(), ORG, { email: "team-newcomer@test.local", role: "MEMBER" });
    expect(auditHelpers.logMemberInvited).toHaveBeenCalled();
    expect(await db.membership.count({ where: { userId: ids.newcomer, organizationId: ORG } })).toBe(1);
    await expect(inviteTeamMember(actor(), ORG, { email: "team-newcomer@test.local", role: "MEMBER" })).rejects.toThrow("already a member");
  });

  it("does not find another dealership's member", async () => {
    await expect(changeMemberRole(actor(), ORG, { memberId: ids.otherMembership, newRole: "OWNER" })).rejects.toThrow("Member");
    await expect(removeTeamMember(actor(), ORG, ids.otherMembership)).rejects.toThrow("Member");
    expect(await db.membership.findUnique({ where: { id: ids.otherMembership } })).toMatchObject({ role: "MEMBER" });
  });

  it("never demotes or removes the owner", async () => {
    await expect(changeMemberRole(actor(), ORG, { memberId: ids.ownerMembership, newRole: "MEMBER" })).rejects.toThrow("owner");
    await expect(removeTeamMember(actor(), ORG, ids.ownerMembership)).rejects.toThrow("owner");
  });

  it("changes a member's role, and removes them", async () => {
    await changeMemberRole(actor(), ORG, { memberId: ids.memberMembership, newRole: "OWNER" });
    expect(await db.membership.findUnique({ where: { id: ids.memberMembership } })).toMatchObject({ role: "OWNER" });
    await db.membership.update({ where: { id: ids.memberMembership }, data: { role: "MEMBER" } });

    await removeTeamMember(actor(), ORG, ids.memberMembership);
    expect(auditHelpers.logMemberRemoved).toHaveBeenCalled();
    expect(await db.membership.findUnique({ where: { id: ids.memberMembership } })).toBeNull();
  });

  it("names the owner as the billing contact, and no one where there is no owner", async () => {
    expect(await getBillingContact(ORG)).toEqual({ name: "Team owner", email: "team-owner@test.local" });
    expect(await getBillingContact(OTHER_ORG)).toBeNull();
  });

  it("lists a dealership's members for its owner, searchable, and only that dealership's", async () => {
    const all = await getUsers(null, { page: 1, limit: 10 }, CLERK.owner, ORG);
    expect(all.users.map((u) => u.id).sort()).toEqual([ids.owner, ids.newcomer].sort());
    const found = await getUsers("newcomer", { page: 1, limit: 10 }, CLERK.owner, ORG);
    expect(found.users.map((u) => u.id)).toEqual([ids.newcomer]);
  });
});
