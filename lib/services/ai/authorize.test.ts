import { describe, it, expect, vi, beforeEach } from "vitest";

const countOrgAiCarsThisMonth = vi.hoisted(() => vi.fn());
vi.mock("@/lib/repositories/ai-usage", () => ({ countOrgAiCarsThisMonth }));
const enforceDealerAiLimit = vi.hoisted(() => vi.fn());
vi.mock("@/lib/middleware/with-rate-limit", () => ({ enforceDealerAiLimit }));
const planInEffect = vi.hoisted(() => vi.fn());
vi.mock("@/lib/services/billing/entitlements", async (orig) => ({
  ...(await orig<object>()),
  planInEffect,
}));

import { authorizeDealerAiFeature, publicAiCaller } from "@/lib/services/ai/authorize";
import { AI_FEATURES, AI_FEATURE_POLICY, DEALER_BILLED_FEATURES, type AiFeature } from "@/lib/ai/features";
import { PlanLimitError, RateLimitError } from "@/lib/utils/errors";
import type { TenantContext } from "@/lib/auth/context";

const pro = { name: "Pro", monthlyPrice: 80_000, yearlyPrice: 800_000, features: { aiProcessing: { enabled: true, limit: 100 } } };
const starter = { name: "Starter", monthlyPrice: 0, yearlyPrice: 0, features: { aiProcessing: { enabled: true, limit: 5 } } };
const ctx = { user: { id: "db-user" }, userId: "clerk_user", organization: { id: "org-1", slug: "nile" } } as unknown as TenantContext;

beforeEach(() => {
  vi.clearAllMocks();
  planInEffect.mockResolvedValue(pro);
  countOrgAiCarsThisMonth.mockResolvedValue(0);
  enforceDealerAiLimit.mockResolvedValue(undefined);
});

describe("AI_FEATURE_POLICY", () => {
  it("bills the dealer for exactly the dealer listing features", () => {
    expect([...DEALER_BILLED_FEATURES].sort()).toEqual(["carListingFromImage", "listingQualityCoach", "listingTranslation"]);
  });

  it("never runs an anonymous or platform feature at a paying dealer's priority", () => {
    for (const feature of Object.keys(AI_FEATURE_POLICY) as AiFeature[]) {
      const policy = AI_FEATURE_POLICY[feature];
      if (policy.audience !== "dealer" && feature !== "listingQA") expect(policy.priority).toBe("low");
    }
  });
});

describe("authorizeDealerAiFeature", () => {
  it("bills the database user, at standard priority on a paid plan in effect", async () => {
    expect(await authorizeDealerAiFeature(ctx, AI_FEATURES.carListingFromImage)).toEqual({
      organizationId: "org-1",
      userId: "db-user",
      priority: "standard",
    });
    expect(enforceDealerAiLimit).toHaveBeenCalledTimes(1);
  });

  it("runs at low priority on the free plan — including a lapsed paid plan, which is the free one", async () => {
    planInEffect.mockResolvedValue(starter);
    expect((await authorizeDealerAiFeature(ctx, AI_FEATURES.listingTranslation)).priority).toBe("low");
  });

  it("refuses a plan without AI, before counting or rate-limiting", async () => {
    planInEffect.mockResolvedValue({ ...pro, features: { aiProcessing: { enabled: false, limit: 100 } } });
    await expect(authorizeDealerAiFeature(ctx, AI_FEATURES.listingQualityCoach)).rejects.toBeInstanceOf(PlanLimitError);
    expect(countOrgAiCarsThisMonth).not.toHaveBeenCalled();
    expect(enforceDealerAiLimit).not.toHaveBeenCalled();
  });

  it("refuses once this month's allowance is used, counting only the billed features", async () => {
    planInEffect.mockResolvedValue(starter);
    countOrgAiCarsThisMonth.mockResolvedValue(5);
    await expect(authorizeDealerAiFeature(ctx, AI_FEATURES.carListingFromImage)).rejects.toBeInstanceOf(PlanLimitError);
    expect(countOrgAiCarsThisMonth).toHaveBeenCalledWith("org-1", DEALER_BILLED_FEATURES);
  });

  it("does not count an unlimited allowance", async () => {
    planInEffect.mockResolvedValue({ ...pro, features: { aiProcessing: { enabled: true, limit: -1 } } });
    await authorizeDealerAiFeature(ctx, AI_FEATURES.carListingFromImage);
    expect(countOrgAiCarsThisMonth).not.toHaveBeenCalled();
  });

  it("passes the dealer-AI rate limit's refusal on", async () => {
    enforceDealerAiLimit.mockRejectedValue(new RateLimitError());
    await expect(authorizeDealerAiFeature(ctx, AI_FEATURES.carListingFromImage)).rejects.toBeInstanceOf(RateLimitError);
  });

  it("refuses with no plan at all", async () => {
    planInEffect.mockResolvedValue(null);
    await expect(authorizeDealerAiFeature(ctx, AI_FEATURES.carListingFromImage)).rejects.toBeInstanceOf(PlanLimitError);
  });

  it("will not authorize a non-dealer feature — those have no plan or allowance to check", async () => {
    await expect(authorizeDealerAiFeature(ctx, AI_FEATURES.searchFiltersFromImage)).rejects.toThrow("not a dealer feature");
  });
});

describe("publicAiCaller", () => {
  it("bills no one, at low priority, attributed to the storefront if any", () => {
    expect(publicAiCaller(AI_FEATURES.searchFiltersFromImage, "org-9")).toEqual({ organizationId: "org-9", userId: null, priority: "low" });
    expect(publicAiCaller(AI_FEATURES.carSearchQuery)).toEqual({ organizationId: null, userId: null, priority: "low" });
  });

  it("refuses a dealer feature, which must be authorized", () => {
    expect(() => publicAiCaller(AI_FEATURES.carListingFromImage)).toThrow("dealer feature");
  });
});
