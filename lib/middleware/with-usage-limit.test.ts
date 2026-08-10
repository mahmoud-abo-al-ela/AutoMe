import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlanLimitError } from "@/lib/utils/errors";

// The metering count is the only thing that decides whether the gate trips.
// Mock the repository so we control "how many AI calls this org made this month"
// without a database. countQuery in plan-limits.js delegates here.
const { countOrgAiCallsThisMonth } = vi.hoisted(() => ({
  countOrgAiCallsThisMonth: vi.fn(),
}));

vi.mock("@/lib/repositories/ai-usage", () => ({
  countOrgAiCallsThisMonth,
  countPlatformCallsSince: vi.fn(),
}));

import { withUsageLimit } from "@/lib/middleware/with-usage-limit";
import type { TenantContext } from "@/lib/auth/context";

// Partial fixture: the gate only reads userId and the plan feature limit.
function ctxWithAiLimit(limit: number): TenantContext {
  return ({
    userId: "u1",
    organization: {
      id: "org-1",
      slug: "dealer-a",
      subscription: { plan: { name: "Free", features: { aiProcessing: { limit } } } },
    },
  } as unknown) as TenantContext;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("withUsageLimit(aiProcessing)", () => {
  it("refuses the 6th AI call when the plan limit is 5", async () => {
    countOrgAiCallsThisMonth.mockResolvedValue(5); // already at the limit
    const inner = vi.fn();

    const guarded = withUsageLimit("aiProcessing", inner);

    await expect(guarded(ctxWithAiLimit(5))).rejects.toBeInstanceOf(PlanLimitError);
    expect(inner).not.toHaveBeenCalled();
  });

  it("allows the call while under the limit", async () => {
    countOrgAiCallsThisMonth.mockResolvedValue(2);
    const inner = vi.fn().mockResolvedValue("ok");

    const guarded = withUsageLimit("aiProcessing", inner);

    await expect(guarded(ctxWithAiLimit(5))).resolves.toBe("ok");
    expect(inner).toHaveBeenCalledOnce();
  });
});
