import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const cookie = vi.hoisted(() => ({ sessionId: null as string | null }));
vi.mock("@/lib/services/impersonation/cookie", () => ({
  setImpersonationCookies: vi.fn(),
  clearImpersonationCookies: vi.fn(),
  getSessionIdFromCookies: vi.fn(async () => cookie.sessionId),
}));
vi.mock("@/lib/services/audit", () => ({
  auditHelpers: { logImpersonationStarted: vi.fn(), logImpersonationEnded: vi.fn() },
}));

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import {
  getActiveImpersonationCount,
  getCurrentImpersonationSession,
  getImpersonationSessions,
} from "@/lib/services/impersonation/impersonation";
import { validateSuperAdmin, validateTargetMembership } from "@/lib/services/impersonation/validation";
import { clearImpersonationCookies } from "@/lib/services/impersonation/cookie";
import { db } from "@/lib/prisma";

/**
 * Support sessions against real Postgres: who may start one, who may be
 * signed in as, and how long one lasts.
 */

const ORG = "org_test_impersonation";
const CLERK_IDS = ["clerk_test_imp_admin", "clerk_test_imp_member", "clerk_test_imp_outsider"];
const HOUR = 60 * 60 * 1000;

let adminId = "";
let memberId = "";
let outsiderId = "";

async function session(startedAgoMs: number, ended = false) {
  const row = await db.impersonationSession.create({
    data: {
      superAdminId: adminId,
      targetUserId: memberId,
      targetOrganizationId: ORG,
      reason: "test",
      startedAt: new Date(Date.now() - startedAgoMs),
      endedAt: ended ? new Date() : null,
    },
  });
  return row.id;
}

describe.skipIf(!hasTestDb)("impersonation (real Postgres)", () => {
  beforeAll(async () => {
    await db.organization.deleteMany({ where: { id: ORG } });
    await db.user.deleteMany({ where: { clerkId: { in: CLERK_IDS } } });
    await db.organization.create({ data: { id: ORG, name: "Support Motors", slug: "impersonation-test", isActive: true } });
    const [admin, member, outsider] = await Promise.all([
      db.user.create({ data: { clerkId: CLERK_IDS[0], email: "imp-admin@test.local", role: "ADMIN" } }),
      db.user.create({ data: { clerkId: CLERK_IDS[1], email: "imp-member@test.local" } }),
      db.user.create({ data: { clerkId: CLERK_IDS[2], email: "imp-outsider@test.local" } }),
    ]);
    adminId = admin.id;
    memberId = member.id;
    outsiderId = outsider.id;
    await db.membership.create({ data: { userId: member.id, organizationId: ORG, role: "OWNER" } });
  });

  afterAll(async () => {
    await db.impersonationSession.deleteMany({ where: { targetOrganizationId: ORG } });
    await db.organization.deleteMany({ where: { id: ORG } });
    await db.user.deleteMany({ where: { clerkId: { in: CLERK_IDS } } });
    await db.$disconnect();
  });

  beforeEach(async () => {
    await db.impersonationSession.deleteMany({ where: { targetOrganizationId: ORG } });
    cookie.sessionId = null;
    vi.mocked(clearImpersonationCookies).mockClear();
  });

  it("lets only an admin start a session", async () => {
    await expect(validateSuperAdmin(adminId)).resolves.toMatchObject({ id: adminId });
    await expect(validateSuperAdmin(memberId)).rejects.toThrow("Only admins");
    await expect(validateSuperAdmin("no-such-user")).rejects.toThrow("Only admins");
  });

  it("signs in only as a member of the dealership", async () => {
    const membership = await validateTargetMembership(memberId, ORG);
    expect(membership.organization.slug).toBe("impersonation-test");
    await expect(validateTargetMembership(outsiderId, ORG)).rejects.toThrow("does not have access");
  });

  it("counts a session as active only while open and within its four hours", async () => {
    const before = await getActiveImpersonationCount();
    await session(HOUR);
    await session(5 * HOUR);
    await session(HOUR, true);
    expect(await getActiveImpersonationCount()).toBe(before + 1);
  });

  it("lists sessions for one dealership, with its name", async () => {
    await session(HOUR);
    const { sessions, pagination } = await getImpersonationSessions({ filters: { targetOrganizationId: ORG } });
    expect(pagination.total).toBe(1);
    expect(sessions[0].targetOrganization).toMatchObject({ name: "Support Motors" });
    expect(sessions[0].superAdmin.id).toBe(adminId);
  });

  it("keeps a running session, with who is in it", async () => {
    cookie.sessionId = await session(HOUR);
    const current = await getCurrentImpersonationSession();
    expect(current).toMatchObject({ superAdmin: { id: adminId }, targetUser: { id: memberId } });
  });

  it("ends a session past its four hours and forgets it", async () => {
    const id = await session(5 * HOUR);
    cookie.sessionId = id;
    expect(await getCurrentImpersonationSession()).toBeNull();
    const row = await db.impersonationSession.findUnique({ where: { id } });
    expect(row?.endedAt).not.toBeNull();
    expect(clearImpersonationCookies).toHaveBeenCalled();
  });

  it("forgets a session that was already ended", async () => {
    cookie.sessionId = await session(HOUR, true);
    expect(await getCurrentImpersonationSession()).toBeNull();
    expect(clearImpersonationCookies).toHaveBeenCalled();
  });
});
