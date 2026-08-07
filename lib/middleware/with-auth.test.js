import { describe, it, expect, vi, beforeEach } from "vitest";

// with-auth composes tenant resolution + error mapping. Mock the resolvers so we
// can assert the wrapper's contract: pass ctx through on success, and convert a
// thrown typed error into the standard error response (never let it escape).
vi.mock("@/lib/auth", () => ({
  resolveAuthContext: vi.fn(),
  resolveTenantContext: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/services/super-admin/auth", () => ({ requireSuperAdmin: vi.fn() }));

import { resolveTenantContext } from "@/lib/auth";
import { withOrgAuth } from "@/lib/middleware/with-auth";
import { AuthorizationError, PlanLimitError } from "@/lib/utils/errors";

const ctx = { userId: "u1", organization: { id: "org-1" }, membership: { role: "OWNER" } };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("withOrgAuth", () => {
  it("passes the resolved ctx and the caller args to the action", async () => {
    resolveTenantContext.mockResolvedValue(ctx);
    const action = vi.fn().mockResolvedValue({ success: true, data: 42 });

    const result = await withOrgAuth(action)("carId", { featured: true });

    expect(action).toHaveBeenCalledWith(ctx, "carId", { featured: true });
    expect(result).toEqual({ success: true, data: 42 });
  });

  it("maps a thrown AuthorizationError to a structured error response", async () => {
    resolveTenantContext.mockResolvedValue(ctx);
    const action = vi.fn().mockRejectedValue(new AuthorizationError("nope"));

    const result = await withOrgAuth(action)();

    expect(result.success).toBe(false);
    expect(result.error.code).toBe("AUTHORIZATION_ERROR");
    expect(result.error.message).toBe("nope");
  });

  it("does not run the action when tenant resolution fails, and maps that error", async () => {
    resolveTenantContext.mockRejectedValue(new AuthorizationError("no access"));
    const action = vi.fn();

    const result = await withOrgAuth(action)();

    expect(action).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error.code).toBe("AUTHORIZATION_ERROR");
  });

  it("surfaces plan-limit fields from a thrown PlanLimitError", async () => {
    resolveTenantContext.mockResolvedValue(ctx);
    const action = vi.fn().mockRejectedValue(
      new PlanLimitError({ resource: "cars", planType: "Free", limit: 5, currentUsage: 5 }),
    );

    const result = await withOrgAuth(action)();

    expect(result.error.code).toBe("PLAN_LIMIT_EXCEEDED");
    expect(result.error.resource).toBe("cars");
    expect(result.error.limit).toBe(5);
  });
});
