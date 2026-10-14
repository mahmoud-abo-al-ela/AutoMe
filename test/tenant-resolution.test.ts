import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";

vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

const session = vi.hoisted(() => ({
  clerkId: null as string | null,
  clerkUser: null as unknown,
  headers: {} as Record<string, string>,
  cookies: {} as Record<string, string>,
}));
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: session.clerkId })),
  currentUser: vi.fn(async () => session.clerkUser),
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers(session.headers)),
  cookies: vi.fn(async () => ({
    get: (name: string) => (name in session.cookies ? { name, value: session.cookies[name] } : undefined),
  })),
}));

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { checkUser, getActualUser, isSuperAdmin } from "@/lib/checkUser";
import {
  getCurrentOrganization,
  getOrganization,
  getOrganizationById,
  getOrganizationBySlug,
  getUserOrganizations,
} from "@/lib/org/resolve";
import { checkOrganizationAccess, getUserMembership, requireOwner } from "@/lib/org/access";
import { resolveTenantContext } from "@/lib/auth/context";
import { AuthorizationError } from "@/lib/utils/errors";
import { db } from "@/lib/prisma";

/**
 * Who is asking, and in which dealership — checkUser and lib/org — against
 * real Postgres. These run on every authenticated request; this pins what
 * they do so the code behind them can move.
 */

const ORGS = { a: "org_test_tenant_a", b: "org_test_tenant_b", off: "org_test_tenant_off", pending: "org_test_tenant_pending" };
const CLERK = {
  owner: "clerk_test_tenant_owner",
  member: "clerk_test_tenant_member",
  admin: "clerk_test_tenant_admin",
  fresh: "clerk_test_tenant_fresh",
  heir: "clerk_test_tenant_heir",
  phone: "clerk_test_tenant_phone",
};
const HEIR_EMAIL = "tenant-heir@test.local";
const ids: Record<string, string> = {};

function signIn(clerkId: string | null, headers: Record<string, string> = {}, cookies: Record<string, string> = {}) {
  session.clerkId = clerkId;
  session.headers = headers;
  session.cookies = cookies;
}

/** A support session row, as startImpersonation writes it. */
async function supportSession(targetUserId: string, organizationId: string) {
  return db.impersonationSession.create({
    data: { superAdminId: ids.admin, targetUserId, targetOrganizationId: organizationId, reason: "tenant resolution test" },
  });
}

describe.skipIf(!hasTestDb)("tenant resolution (real Postgres)", () => {
  beforeAll(async () => {
    await db.organization.deleteMany({ where: { id: { in: Object.values(ORGS) } } });
    await db.user.deleteMany({ where: { clerkId: { in: Object.values(CLERK) } } });
    await db.organization.createMany({
      data: [
        { id: ORGS.a, name: "Tenant B Motors", slug: "tenant-test-a", isActive: true },
        { id: ORGS.b, name: "Tenant A Motors", slug: "tenant-test-b", isActive: true },
        { id: ORGS.off, name: "Tenant Off Motors", slug: "tenant-test-off", isActive: false },
        { id: ORGS.pending, name: "Tenant Pending Motors", slug: "tenant-test-pending", isActive: true, pendingOwnerEmail: HEIR_EMAIL },
      ],
    });
    for (const key of ["owner", "member", "admin", "heir"] as const) {
      const user = await db.user.create({
        data: { clerkId: CLERK[key], email: key === "heir" ? HEIR_EMAIL : `tenant-${key}@test.local`, name: `Tenant ${key}`, role: key === "admin" ? "ADMIN" : "USER" },
      });
      ids[key] = user.id;
    }
    await db.membership.createMany({
      data: [
        { userId: ids.owner, organizationId: ORGS.a, role: "OWNER" },
        { userId: ids.owner, organizationId: ORGS.b, role: "MEMBER" },
        { userId: ids.member, organizationId: ORGS.a, role: "MEMBER" },
      ],
    });
  });

  afterAll(async () => {
    await db.auditLog.deleteMany({ where: { organizationId: { in: Object.values(ORGS) } } });
    await db.organization.deleteMany({ where: { id: { in: Object.values(ORGS) } } });
    await db.user.deleteMany({ where: { clerkId: { in: Object.values(CLERK) } } });
    await db.$disconnect();
  });

  beforeEach(() => signIn(null));

  describe("checkUser", () => {
    it("is null when nobody is signed in", async () => {
      expect(await checkUser()).toBeNull();
    });

    it("loads the user with every organization, its subscription and plan", async () => {
      signIn(CLERK.owner);
      const user = await checkUser();
      expect(user?.id).toBe(ids.owner);
      expect(user?.memberships.map((m) => m.organization.id).sort()).toEqual([ORGS.a, ORGS.b].sort());
      expect(user?.memberships[0].organization).toHaveProperty("subscription");
    });

    it("creates a user Clerk knows and we do not, from their Clerk profile", async () => {
      signIn(CLERK.fresh);
      session.clerkUser = { firstName: " Fresh", lastName: "Face ", imageUrl: "https://img/x.png", emailAddresses: [{ emailAddress: "tenant-fresh@test.local" }] };
      const user = await checkUser();
      expect(user).toMatchObject({ clerkId: CLERK.fresh, name: "Fresh Face", email: "tenant-fresh@test.local", memberships: [] });
      expect(await db.user.count({ where: { clerkId: CLERK.fresh } })).toBe(1);
    });

    it("makes a user the owner of every dealership waiting for their email, once", async () => {
      signIn(CLERK.heir);
      const user = await checkUser();
      expect(user?.memberships).toEqual([expect.objectContaining({ organizationId: ORGS.pending, role: "OWNER" })]);
      expect(await db.organization.findUnique({ where: { id: ORGS.pending } })).toMatchObject({ pendingOwnerEmail: null });
      expect(await db.auditLog.count({ where: { organizationId: ORGS.pending, action: "MEMBER_ACCEPTED" } })).toBe(1);

      await checkUser();
      expect(await db.membership.count({ where: { userId: ids.heir } })).toBe(1);
    });

    it("never hands a user with no email the dealerships waiting for an owner", async () => {
      signIn(CLERK.phone);
      session.clerkUser = { firstName: "Phone", lastName: "Only", imageUrl: null, emailAddresses: [] };
      const user = await checkUser();
      expect(user).toMatchObject({ email: null, memberships: [] });
    });

    it("lets an admin view as another user inside a verified session, keeping who they really are", async () => {
      const row = await supportSession(ids.member, ORGS.a);
      // The cookies name someone else; the session row decides who.
      signIn(CLERK.admin, {}, { "x-impersonation-session": row.id, "x-impersonated-user": ids.owner });
      const user = await checkUser();
      expect(user).toMatchObject({ id: ids.member, isImpersonated: true, actualUser: { id: ids.admin, role: "ADMIN" } });
      expect(user?.impersonation).toMatchObject({ sessionId: row.id, targetOrganizationId: ORGS.a });
      expect(await getActualUser()).toMatchObject({ id: ids.admin });
    });

    it("stops impersonating on the next request once the session is ended", async () => {
      const row = await supportSession(ids.member, ORGS.a);
      await db.impersonationSession.update({ where: { id: row.id }, data: { endedAt: new Date() } });
      signIn(CLERK.admin, {}, { "x-impersonation-session": row.id });
      const user = await checkUser();
      expect(user?.id).toBe(ids.admin);
      expect(user?.isImpersonated).toBeUndefined();
    });

    it("ignores impersonation headers and a made-up session cookie, from an admin or anyone else", async () => {
      const forged = { "x-impersonation-active": "true", "x-impersonated-user": ids.owner };
      signIn(CLERK.admin, forged, { "x-impersonation-session": "made-up", "x-impersonated-user": ids.owner });
      expect((await checkUser())?.id).toBe(ids.admin);

      signIn(CLERK.member, forged, { "x-impersonation-session": "made-up", "x-impersonated-user": ids.owner });
      const user = await checkUser();
      expect(user?.id).toBe(ids.member);
      expect(user?.isImpersonated).toBeUndefined();
    });

    it("ignores another admin's real session id", async () => {
      const row = await supportSession(ids.member, ORGS.a);
      // The member somehow holds the admin's session id: it is not theirs.
      signIn(CLERK.member, {}, { "x-impersonation-session": row.id });
      const user = await checkUser();
      expect(user?.id).toBe(ids.member);
      expect(user?.isImpersonated).toBeUndefined();
    });

    it("knows a platform admin", async () => {
      signIn(CLERK.admin);
      expect(await isSuperAdmin()).toBe(true);
      signIn(CLERK.member);
      expect(await isSuperAdmin()).toBe(false);
    });
  });

  describe("lib/org", () => {
    it("finds an active dealership by slug or id, with its subscription, and never a suspended one", async () => {
      expect(await getOrganizationBySlug("tenant-test-a")).toMatchObject({ id: ORGS.a, subscription: null });
      expect(await getOrganizationById(ORGS.a)).toMatchObject({ id: ORGS.a });
      expect(await getOrganizationBySlug("tenant-test-off")).toBeNull();
      expect(await getOrganizationById(ORGS.off)).toBeNull();
      expect(await getOrganizationBySlug(null)).toBeNull();
    });

    it("resolves the dealership a subdomain names", async () => {
      signIn(null, { "x-organization-slug": "tenant-test-a" });
      expect(await getCurrentOrganization()).toMatchObject({ id: ORGS.a });
      signIn(null);
      expect(await getCurrentOrganization()).toBeNull();
    });

    it("pairs a dealership with the signed-in user's membership, or none", async () => {
      expect(await getOrganization("tenant-test-a")).toEqual({ organization: null, membership: null });
      signIn(CLERK.member);
      expect(await getOrganization("tenant-test-a")).toMatchObject({ organization: { id: ORGS.a }, membership: { role: "MEMBER" } });
      expect(await getOrganization("tenant-test-b")).toMatchObject({ organization: { id: ORGS.b }, membership: null });
      expect(await getOrganization("no-such-dealership")).toEqual({ organization: null, membership: null });
    });

    it("lists a user's dealerships by name, with their role there", async () => {
      const orgs = await getUserOrganizations(ids.owner);
      expect(orgs.map((o) => [o.name, o.role])).toEqual([
        ["Tenant A Motors", "MEMBER"],
        ["Tenant B Motors", "OWNER"],
      ]);
      expect(orgs[0]).toHaveProperty("membershipId");
    });

    it("checks access by role: owner above member, nobody outside", async () => {
      expect(await checkOrganizationAccess(ids.member, ORGS.a)).toBe(true);
      expect(await checkOrganizationAccess(ids.member, ORGS.a, "OWNER")).toBe(false);
      expect(await checkOrganizationAccess(ids.owner, ORGS.a, "OWNER")).toBe(true);
      expect(await checkOrganizationAccess(ids.member, ORGS.b)).toBe(false);
    });

    it("loads a membership with its dealership, and requires the owner", async () => {
      expect(await getUserMembership(ids.owner, ORGS.a)).toMatchObject({ role: "OWNER", organization: { id: ORGS.a } });
      expect(await getUserMembership(ids.member, ORGS.b)).toBeNull();
      await expect(requireOwner(ids.owner, ORGS.a)).resolves.toMatchObject({ role: "OWNER" });
      await expect(requireOwner(ids.member, ORGS.a)).rejects.toThrow("Only owners");
    });
  });

  describe("resolveTenantContext on a dashboard", () => {
    it("acts for the dealership in the dashboard URL for a user of several", async () => {
      // The owner belongs to A (OWNER) and B (MEMBER). On B's dashboard, B.
      signIn(CLERK.owner, { "x-dashboard-org": "tenant-test-b" });
      const ctx = await resolveTenantContext();
      expect(ctx.organization.id).toBe(ORGS.b);
      expect(ctx.membership).toMatchObject({ organizationId: ORGS.b, role: "MEMBER" });

      signIn(CLERK.owner, { "x-dashboard-org": "tenant-test-a" });
      expect((await resolveTenantContext()).organization.id).toBe(ORGS.a);
    });

    it("refuses a dashboard the user is not a member of", async () => {
      signIn(CLERK.member, { "x-dashboard-org": "tenant-test-b" });
      await expect(resolveTenantContext()).rejects.toBeInstanceOf(AuthorizationError);
    });
  });
});
