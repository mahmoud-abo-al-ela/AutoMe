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

const orgA = { id: "org-aaa", slug: "dealer-a" };
const orgB = { id: "org-bbb", slug: "dealer-b" };
const orgC = { id: "org-ccc", slug: "dealer-c" };

function membership(org, role = "OWNER") {
  return { id: `mem-${org.id}`, organizationId: org.id, role, organization: org };
}

function setHeaders(map = {}) {
  headers.mockResolvedValue(new Headers(map));
}

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: "clerk_user_1" });
  setHeaders();
});

describe("resolveTenantContext", () => {
  it("targets org B when a multi-org member acts on org B", async () => {
    checkUser.mockResolvedValue({
      id: "user-1",
      role: "USER",
      memberships: [membership(orgA), membership(orgB)],
    });
    // Middleware resolved the subdomain/header to dealer-b.
    getCurrentOrganization.mockResolvedValue(orgB);

    const ctx = await resolveTenantContext();

    expect(ctx.organization.id).toBe(orgB.id);
    expect(ctx.membership.organizationId).toBe(orgB.id);
  });

  it("rejects a forged x-organization-slug for a non-member org", async () => {
    // User belongs to org A only...
    checkUser.mockResolvedValue({
      id: "user-1",
      role: "USER",
      memberships: [membership(orgA)],
    });
    // ...but a forged header resolved org C, which they have no membership in.
    getCurrentOrganization.mockResolvedValue(orgC);

    await expect(resolveTenantContext()).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("resolves to the target user during impersonation, keeping the admin as actualUser", async () => {
    // checkUser returns the impersonated target (verified against ADMIN there).
    checkUser.mockResolvedValue({
      id: "target-user",
      role: "USER",
      memberships: [membership(orgB)],
      isImpersonated: true,
      actualUser: { id: "admin-user", role: "ADMIN" },
    });
    getCurrentOrganization.mockResolvedValue(orgB);
    setHeaders({ "x-impersonation-active": "true" });

    const ctx = await resolveTenantContext();

    expect(ctx.user.id).toBe("target-user");
    expect(ctx.organization.id).toBe(orgB.id);
    expect(ctx.actualUser.id).toBe("admin-user");
    expect(ctx.isImpersonating).toBe(true);
  });
});
