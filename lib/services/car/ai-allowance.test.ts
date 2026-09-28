import { describe, it, expect, vi, beforeEach } from "vitest";

const { attributeAiUsageToCar, countOrgUnsavedAiCallsThisMonth } = vi.hoisted(() => ({
  attributeAiUsageToCar: vi.fn(),
  countOrgUnsavedAiCallsThisMonth: vi.fn(),
}));
vi.mock("@/lib/repositories/ai-usage", () => ({ attributeAiUsageToCar, countOrgUnsavedAiCallsThisMonth }));

import { assertUnsavedReadsLeft, claimAiUsageForCar } from "@/lib/services/car/ai-allowance";
import { PlanLimitError } from "@/lib/utils/errors";
import type { TenantContext } from "@/lib/auth/context";

function ctx(limit: number | undefined) {
  return {
    user: { id: "db-user-1" },
    userId: "clerk_user_1",
    organization: {
      id: "org-1",
      slug: "nile",
      subscription: { plan: { features: { aiProcessing: { enabled: true, limit } } } },
    },
  } as unknown as TenantContext;
}

beforeEach(() => vi.resetAllMocks());

describe("claimAiUsageForCar", () => {
  it("claims this user's billable calls in this organization from the last day", async () => {
    const before = Date.now();
    await claimAiUsageForCar(ctx(5), "car-1");
    const claim = attributeAiUsageToCar.mock.calls[0][0];
    expect(claim).toMatchObject({
      organizationId: "org-1",
      // The DB user id the calls were metered with, never the Clerk id.
      userId: "db-user-1",
      carId: "car-1",
      features: ["carListingFromImage", "listingTranslation", "listingQualityCoach"],
    });
    // A day before the claim, which ran a moment after `before`.
    const window = before - claim.since.getTime();
    expect(window).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    expect(window).toBeGreaterThan(24 * 60 * 60 * 1000 - 5_000);
  });

  it("never fails the save it follows", async () => {
    attributeAiUsageToCar.mockRejectedValue(new Error("db down"));
    await expect(claimAiUsageForCar(ctx(5), "car-1")).resolves.toBeUndefined();
  });
});

describe("assertUnsavedReadsLeft", () => {
  it("allows unsaved photo reads up to three per listing in the plan", async () => {
    countOrgUnsavedAiCallsThisMonth.mockResolvedValue(14);
    await expect(assertUnsavedReadsLeft(ctx(5))).resolves.toBeUndefined();
    expect(countOrgUnsavedAiCallsThisMonth).toHaveBeenCalledWith("org-1", "carListingFromImage");

    countOrgUnsavedAiCallsThisMonth.mockResolvedValue(15);
    await expect(assertUnsavedReadsLeft(ctx(5))).rejects.toBeInstanceOf(PlanLimitError);
  });

  it("does not count on an unlimited plan", async () => {
    await assertUnsavedReadsLeft(ctx(-1));
    expect(countOrgUnsavedAiCallsThisMonth).not.toHaveBeenCalled();
  });
});
