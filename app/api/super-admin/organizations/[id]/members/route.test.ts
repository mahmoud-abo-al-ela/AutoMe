import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticationError, AuthorizationError } from "@/lib/utils/errors";

const { auth, requireSuperAdmin, listOrganizationMembers, checkUser } = vi.hoisted(() => ({
  auth: vi.fn(),
  requireSuperAdmin: vi.fn(),
  listOrganizationMembers: vi.fn(),
  checkUser: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth }));
vi.mock("@/lib/services/super-admin/auth", () => ({ requireSuperAdmin }));
vi.mock("@/lib/services/super-admin", () => ({ orgService: { listOrganizationMembers } }));
vi.mock("@/lib/checkUser", () => ({ checkUser }));

import { GET } from "./route";

const call = () => GET(new Request("http://localhost/api/super-admin/organizations/org-b/members"), { params: Promise.resolve({ id: "org-b" }) });

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: "clerk_admin" });
  listOrganizationMembers.mockResolvedValue([{ userId: "u1", role: "OWNER" }]);
});

describe("GET /api/super-admin/organizations/[id]/members", () => {
  it("authorizes the signed-in account by its Clerk id — so an admin in a support session still gets in", async () => {
    requireSuperAdmin.mockResolvedValue({ id: "admin-user", role: "ADMIN" });

    const response = await call();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ members: [{ userId: "u1", role: "OWNER" }] });
    expect(requireSuperAdmin).toHaveBeenCalledWith("clerk_admin");
    // checkUser would answer with the impersonated dealer, not the admin.
    expect(checkUser).not.toHaveBeenCalled();
  });

  it("refuses a signed-in non-admin with 403, and lists nothing", async () => {
    requireSuperAdmin.mockRejectedValue(new AuthorizationError("Admin access required"));

    const response = await call();

    expect(response.status).toBe(403);
    expect(listOrganizationMembers).not.toHaveBeenCalled();
  });

  it("refuses an anonymous request with 401", async () => {
    auth.mockResolvedValue({ userId: null });
    requireSuperAdmin.mockRejectedValue(new AuthenticationError());

    const response = await call();

    expect(response.status).toBe(401);
    expect(listOrganizationMembers).not.toHaveBeenCalled();
  });
});
