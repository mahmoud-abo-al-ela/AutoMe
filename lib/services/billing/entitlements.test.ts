import { describe, it, expect, vi, beforeEach } from "vitest";

const billingRepo = vi.hoisted(() => ({ findPaidRenewalAhead: vi.fn(), findPlanByType: vi.fn() }));
vi.mock("@/lib/repositories/billing", () => billingRepo);

import { planFeature, planInEffect } from "@/lib/services/billing/entitlements";
import { withPlanGate } from "@/lib/middleware/with-plan-gate";
import { periodFrom } from "@/lib/services/billing/periods";
import { PlanLimitError } from "@/lib/utils/errors";
import type { TenantContext } from "@/lib/auth/context";

const starter = { id: "starter", type: "STARTER", name: "Starter", monthlyPrice: 0, yearlyPrice: 0, features: { aiProcessing: { enabled: true, limit: 5 }, prioritySupport: false } };
const pro = { id: "pro", type: "PRO", name: "Pro", monthlyPrice: 80_000, yearlyPrice: 800_000, features: { aiProcessing: { enabled: true, limit: 100 }, prioritySupport: true } };

// A period that ended 31 Oct 2026 (Cairo); the grace runs 7 days after.
const october = periodFrom("2026-10-01", "MONTHLY");
const sub = (overrides: Record<string, unknown> = {}) =>
  ({ organizationId: "org-1", plan: pro, status: "ACTIVE", currentPeriodEnd: october.end, ...overrides }) as never;
const org = (subscription: unknown) => ({ id: "org-1", subscription }) as never;

beforeEach(() => {
  vi.clearAllMocks();
  billingRepo.findPaidRenewalAhead.mockResolvedValue(null);
  billingRepo.findPlanByType.mockImplementation(async (type: string) => (type === "STARTER" ? starter : type === "PRO" ? pro : null));
});

describe("planFeature — one reader for every stored shape", () => {
  const plan = (features: unknown) => ({ features }) as never;

  it("reads { enabled, limit }, and never treats { enabled: false } as on", () => {
    expect(planFeature(plan({ ai: { enabled: true, limit: 5 } }), "ai")).toEqual({ enabled: true, limit: 5 });
    expect(planFeature(plan({ ai: { enabled: false, limit: 100 } }), "ai")).toEqual({ enabled: false, limit: 100 });
    expect(planFeature(plan({ ai: { limit: 5 } }), "ai").enabled).toBe(false);
  });

  it("reads booleans, counts and string tiers", () => {
    expect(planFeature(plan({ x: true }), "x")).toEqual({ enabled: true, limit: null });
    expect(planFeature(plan({ x: false }), "x").enabled).toBe(false);
    expect(planFeature(plan({ x: 0 }), "x")).toEqual({ enabled: false, limit: 0 });
    expect(planFeature(plan({ x: -1 }), "x")).toEqual({ enabled: true, limit: -1 });
    expect(planFeature(plan({ analytics: "basic" }), "analytics").enabled).toBe(true);
    expect(planFeature(plan({ analytics: "" }), "analytics").enabled).toBe(false);
  });

  it("is off for anything missing or unreadable", () => {
    expect(planFeature(null, "x").enabled).toBe(false);
    expect(planFeature(plan(null), "x").enabled).toBe(false);
    expect(planFeature(plan(["x"]), "x").enabled).toBe(false);
    expect(planFeature(plan({}), "x").enabled).toBe(false);
  });
});

describe("planInEffect — the plan the dealership is entitled to now", () => {
  it("is the subscription's plan while the period runs, and through the grace", async () => {
    expect(await planInEffect(org(sub()), new Date("2026-10-20T10:00:00Z"))).toBe(pro);
    expect(await planInEffect(org(sub({ status: "PAST_DUE" })), new Date("2026-11-04T10:00:00Z"))).toBe(pro);
    expect(billingRepo.findPlanByType).not.toHaveBeenCalled();
  });

  it("is the free plan once the grace is over, even if the daily job never ran", async () => {
    // Status still ACTIVE: the job that would have moved it did not run.
    expect(await planInEffect(org(sub()), new Date("2026-11-20T10:00:00Z"))).toBe(starter);
  });

  it("honours a renewal paid for the period that has started, before the job applies it", async () => {
    const november = periodFrom("2026-11-01", "MONTHLY");
    billingRepo.findPaidRenewalAhead.mockResolvedValue({ periodStart: november.start, periodEnd: november.end, plan: { type: "PRO" } });
    expect(await planInEffect(org(sub()), new Date("2026-11-20T10:00:00Z"))).toBe(pro);
  });

  it("never lapses a free plan, and is null without a subscription", async () => {
    expect(await planInEffect(org(sub({ plan: starter, currentPeriodEnd: null })), new Date("2027-01-01T00:00:00Z"))).toBe(starter);
    expect(await planInEffect(org(null))).toBeNull();
  });
});

describe("a gate on a lapsed paid plan", () => {
  it("refuses what only the paid plan included", async () => {
    const ctx = { organization: { id: "org-1", slug: "dealer", subscription: sub() } } as unknown as TenantContext;
    const action = vi.fn(async () => "ran");
    const gated = withPlanGate("prioritySupport", action);

    vi.useFakeTimers({ now: new Date("2026-11-20T10:00:00Z") });
    try {
      await expect(gated(ctx)).rejects.toBeInstanceOf(PlanLimitError);
    } finally {
      vi.useRealTimers();
    }
    expect(action).not.toHaveBeenCalled();
  });
});
