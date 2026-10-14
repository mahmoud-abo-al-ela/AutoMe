import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthorizationError } from "@/lib/utils/errors";

// context.ts reads all of its inputs through these modules. Mocking them lets
// us drive resolveTenantContext without a database or a live Clerk session —
// the whole tenant-selection bug class lives in what they return. next/headers
// is mocked too: context.ts must not read impersonation from request headers,
// and the forged-header tests below prove that it doesn't.
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/lib/checkUser", () => ({ checkUser: vi.fn() }));
vi.mock("@/lib/getOrganization", () => ({
  getCurrentOrganization: vi.fn(),
  getOrganizationById: vi.fn(),
  getOrganizationBySlug: vi.fn(),
  getDashboardOrganizationSlug: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { checkUser } from "@/lib/checkUser";
import {
  getCurrentOrganization,
  getDashboardOrganizationSlug,
  getOrganizationById,
  getOrganizationBySlug,
} from "@/lib/getOrganization";
import { resolveTenantContext } from "@/lib/auth/context";

// vi.mock replaces these with mocks; re-view them as such to configure per test.
// The fixtures below are deliberately partial — only the fields tenant
// resolution reads — so each is asserted through unknown.
const mockAuth = vi.mocked(auth as unknown as () => Promise<unknown>);
const mockHeaders = vi.mocked(headers as unknown as () => Promise<Headers>);
const mockCheckUser = vi.mocked(checkUser as unknown as () => Promise<unknown>);
const mockGetCurrentOrganization = vi.mocked(getCurrentOrganization as unknown as () => Promise<unknown>);
const mockGetOrganizationById = vi.mocked(getOrganizationById as unknown as (id: string) => Promise<unknown>);
const mockGetOrganizationBySlug = vi.mocked(getOrganizationBySlug as unknown as (slug: string) => Promise<unknown>);
const mockDashboardSlug = vi.mocked(getDashboardOrganizationSlug as unknown as () => Promise<string | null>);

const orgA = { id: "org-aaa", slug: "dealer-a" };
const orgB = { id: "org-bbb", slug: "dealer-b" };
const orgC = { id: "org-ccc", slug: "dealer-c" };
const orgsById: Record<string, unknown> = { [orgA.id]: orgA, [orgB.id]: orgB, [orgC.id]: orgC };
const orgsBySlug: Record<string, unknown> = { [orgA.slug]: orgA, [orgB.slug]: orgB, [orgC.slug]: orgC };

function membership(org: { id: string; slug: string }, role = "OWNER") {
  return { id: `mem-${org.id}`, organizationId: org.id, role, organization: org };
}

/** The verified support session checkUser attaches during impersonation. */
function session(targetOrganizationId: string) {
  return {
    sessionId: "session-1",
    superAdmin: { id: "admin-user", email: "a@x.eg", name: "Admin" },
    targetUserId: "target-user",
    targetOrganizationId,
  };
}

/** What a forger sends: every impersonation header middleware used to set, naming org C. */
const FORGED = {
  "x-impersonation-active": "true",
  "x-impersonated-org": orgC.slug,
  "x-impersonated-user": "victim-user",
  "x-impersonation-session": "made-up",
  "x-organization-slug": orgC.slug,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: "clerk_user_1" });
  mockHeaders.mockResolvedValue(new Headers());
  mockGetOrganizationById.mockImplementation(async (id) => orgsById[id] ?? null);
  mockGetOrganizationBySlug.mockImplementation(async (slug) => orgsBySlug[slug] ?? null);
  mockDashboardSlug.mockResolvedValue(null);
});

describe("resolveTenantContext", () => {
  it("targets org B when a multi-org member acts on org B", async () => {
    mockCheckUser.mockResolvedValue({
      id: "user-1",
      role: "USER",
      memberships: [membership(orgA), membership(orgB)],
    });
    // Middleware resolved the subdomain to dealer-b.
    mockGetCurrentOrganization.mockResolvedValue(orgB);

    const ctx = await resolveTenantContext();

    expect(ctx.organization.id).toBe(orgB.id);
    expect(ctx.membership?.organizationId).toBe(orgB.id);
    expect(ctx.isImpersonating).toBe(false);
  });

  it("rejects an organization the user has no membership in", async () => {
    mockCheckUser.mockResolvedValue({ id: "user-1", role: "USER", memberships: [membership(orgA)] });
    mockGetCurrentOrganization.mockResolvedValue(orgC);

    await expect(resolveTenantContext()).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("rejects a non-member who forges every impersonation header and cookie value", async () => {
    // The forger is a member of A only. Before the fix, middleware turned the
    // forged cookies into x-impersonation-active + x-organization-slug: dealer-c,
    // and this resolved org C with no membership.
    mockCheckUser.mockResolvedValue({ id: "user-1", role: "USER", memberships: [membership(orgA)] });
    mockHeaders.mockResolvedValue(new Headers(FORGED));
    mockGetCurrentOrganization.mockResolvedValue(orgC);

    await expect(resolveTenantContext()).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("refuses a platform ADMIN with no verified session in an org they are not a member of", async () => {
    mockCheckUser.mockResolvedValue({ id: "admin-user", role: "ADMIN", memberships: [] });
    mockGetCurrentOrganization.mockResolvedValue(orgC);

    await expect(resolveTenantContext()).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("refuses a platform ADMIN with no session even when they forge the impersonation headers", async () => {
    mockCheckUser.mockResolvedValue({ id: "admin-user", role: "ADMIN", memberships: [] });
    mockHeaders.mockResolvedValue(new Headers(FORGED));
    mockGetCurrentOrganization.mockResolvedValue(orgC);

    await expect(resolveTenantContext()).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("acts on the session's dealership during a verified support session, whatever the subdomain says", async () => {
    // checkUser returns the impersonated target, with the session it verified.
    mockCheckUser.mockResolvedValue({
      id: "target-user",
      role: "USER",
      memberships: [membership(orgB)],
      isImpersonated: true,
      impersonation: session(orgB.id),
      actualUser: { id: "admin-user", role: "ADMIN" },
    });
    mockGetCurrentOrganization.mockResolvedValue(orgC);

    const ctx = await resolveTenantContext();

    expect(ctx.user.id).toBe("target-user");
    expect(ctx.organization.id).toBe(orgB.id);
    expect(ctx.actualUser?.id).toBe("admin-user");
    expect(ctx.isImpersonating).toBe(true);
    expect(mockGetCurrentOrganization).not.toHaveBeenCalled();
  });

  it("keeps a session for one dealership out of another", async () => {
    // The session targets B; B is gone (suspended), so nothing may fall back
    // to the target user's other memberships.
    mockCheckUser.mockResolvedValue({
      id: "target-user",
      role: "USER",
      memberships: [membership(orgA)],
      isImpersonated: true,
      impersonation: session(orgB.id),
      actualUser: { id: "admin-user", role: "ADMIN" },
    });
    mockGetOrganizationById.mockResolvedValue(null);

    await expect(resolveTenantContext()).rejects.toThrow();
  });

  describe("on a dashboard (/[locale]/org/[slug])", () => {
    const multiOrg = { id: "user-1", role: "USER", memberships: [membership(orgA), membership(orgB)] };

    it("acts for the dealership the dashboard URL names, not the user's first membership", async () => {
      // Sorted by id, A comes first: the old fallback would have written to A.
      mockCheckUser.mockResolvedValue(multiOrg);
      mockDashboardSlug.mockResolvedValue(orgB.slug);

      const ctx = await resolveTenantContext();

      expect(ctx.organization.id).toBe(orgB.id);
      expect(ctx.membership?.organizationId).toBe(orgB.id);
    });

    it("refuses a dashboard the user is not a member of, rather than falling back to one they are", async () => {
      mockCheckUser.mockResolvedValue(multiOrg);
      mockDashboardSlug.mockResolvedValue(orgC.slug);

      await expect(resolveTenantContext()).rejects.toBeInstanceOf(AuthorizationError);
    });

    it("refuses a dashboard slug that names no active dealership", async () => {
      mockCheckUser.mockResolvedValue(multiOrg);
      mockDashboardSlug.mockResolvedValue("no-such-dealer");

      await expect(resolveTenantContext()).rejects.toBeInstanceOf(AuthorizationError);
    });

    it("prefers the dashboard over the storefront subdomain", async () => {
      mockCheckUser.mockResolvedValue(multiOrg);
      mockDashboardSlug.mockResolvedValue(orgB.slug);
      mockGetCurrentOrganization.mockResolvedValue(orgA);

      expect((await resolveTenantContext()).organization.id).toBe(orgB.id);
    });

    it("takes a route handler's explicit dealership, with the same membership rule", async () => {
      mockCheckUser.mockResolvedValue(multiOrg);

      expect((await resolveTenantContext({ organizationSlug: orgB.slug })).organization.id).toBe(orgB.id);
      await expect(resolveTenantContext({ organizationSlug: orgC.slug })).rejects.toBeInstanceOf(AuthorizationError);
    });

    it("refuses a dashboard for another dealership than the support session's", async () => {
      const inSession = {
        id: "target-user",
        role: "USER",
        memberships: [membership(orgB)],
        isImpersonated: true,
        impersonation: session(orgB.id),
        actualUser: { id: "admin-user", role: "ADMIN" },
      };
      mockCheckUser.mockResolvedValue(inSession);

      mockDashboardSlug.mockResolvedValue(orgC.slug);
      await expect(resolveTenantContext()).rejects.toBeInstanceOf(AuthorizationError);

      mockDashboardSlug.mockResolvedValue(orgB.slug);
      expect((await resolveTenantContext()).organization.id).toBe(orgB.id);
    });
  });
});
