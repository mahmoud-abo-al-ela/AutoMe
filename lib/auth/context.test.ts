import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthorizationError } from "@/lib/utils/errors";

// context.js reads all of its inputs through these four modules. Mocking them
// lets us drive resolveTenantContext without a database or a live Clerk session
// — the whole tenant-selection bug class lives in what they return.
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/lib/checkUser", () => ({ checkUser: vi.fn() }));
vi.mock("@/lib/getOrganization", () => ({ getCurrentOrganization: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { checkUser } from "@/lib/checkUser";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { resolveTenantContext } from "@/lib/auth/context";

// vi.mock replaces these with mocks; re-view them as such to configure per test.
// The fixtures below are deliberately partial — only the fields tenant
// resolution reads — so each is asserted through unknown.
const mockAuth = vi.mocked(auth as unknown as () => Promise<unknown>);
const mockHeaders = vi.mocked(headers as unknown as () => Promise<Headers>);
const mockCheckUser = vi.mocked(
  checkUser as unknown as () => Promise<unknown>
);
const mockGetCurrentOrganization = vi.mocked(
  getCurrentOrganization as unknown as () => Promise<unknown>
);

const orgA = { id: "org-aaa", slug: "dealer-a" };
const orgB = { id: "org-bbb", slug: "dealer-b" };
const orgC = { id: "org-ccc", slug: "dealer-c" };

function membership(org: { id: string; slug: string }, role = "OWNER") {
  return { id: `mem-${org.id}`, organizationId: org.id, role, organization: org };
}

function setHeaders(map: Record<string, string> = {}) {
  mockHeaders.mockResolvedValue(new Headers(map));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: "clerk_user_1" });
  setHeaders();
});

describe("resolveTenantContext", () => {
  it("targets org B when a multi-org member acts on org B", async () => {
    mockCheckUser.mockResolvedValue({
      id: "user-1",
      role: "USER",
      memberships: [membership(orgA), membership(orgB)],
    });
    // Middleware resolved the subdomain/header to dealer-b.
    mockGetCurrentOrganization.mockResolvedValue(orgB);

    const ctx = await resolveTenantContext();

    expect(ctx.organization.id).toBe(orgB.id);
    expect(ctx.membership?.organizationId).toBe(orgB.id);
  });

  it("rejects a forged x-organization-slug for a non-member org", async () => {
    // User belongs to org A only...
    mockCheckUser.mockResolvedValue({
      id: "user-1",
      role: "USER",
      memberships: [membership(orgA)],
    });
    // ...but a forged header resolved org C, which they have no membership in.
    mockGetCurrentOrganization.mockResolvedValue(orgC);

    await expect(resolveTenantContext()).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("resolves to the target user during impersonation, keeping the admin as actualUser", async () => {
    // checkUser returns the impersonated target (verified against ADMIN there).
    mockCheckUser.mockResolvedValue({
      id: "target-user",
      role: "USER",
      memberships: [membership(orgB)],
      isImpersonated: true,
      actualUser: { id: "admin-user", role: "ADMIN" },
    });
    mockGetCurrentOrganization.mockResolvedValue(orgB);
    setHeaders({ "x-impersonation-active": "true" });

    const ctx = await resolveTenantContext();

    expect(ctx.user.id).toBe("target-user");
    expect(ctx.organization.id).toBe(orgB.id);
    expect(ctx.actualUser?.id).toBe("admin-user");
    expect(ctx.isImpersonating).toBe(true);
  });
});
