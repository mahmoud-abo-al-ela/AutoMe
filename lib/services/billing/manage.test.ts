import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/repositories/billing", () => ({
  findSubscriptionByOrgId: vi.fn(),
  findPlanById: vi.fn(),
  findPlanByType: vi.fn(),
  findPaidRenewalAhead: vi.fn(),
  updateSubscription: vi.fn(),
}));
vi.mock("@/lib/services/audit/audit", () => ({ auditHelpers: { logSubscriptionChanged: vi.fn() } }));
vi.mock("@/lib/services/billing/checkout", () => ({ startCheckout: vi.fn() }));

import * as billingRepo from "@/lib/repositories/billing";
import { startCheckout } from "@/lib/services/billing/checkout";
import { cancelPlan, changePlan, keepCurrentPlan, payRenewal } from "@/lib/services/billing/manage";
import { periodFrom } from "@/lib/services/billing/periods";
import { ConflictError, ValidationError } from "@/lib/utils/errors";

const starter = { id: "starter", type: "STARTER", isActive: true, monthlyPrice: 0, yearlyPrice: 0 };
const pro = { id: "pro", type: "PRO", isActive: true, monthlyPrice: 150_000, yearlyPrice: 1_500_000 };
const enterprise = { id: "ent", type: "ENTERPRISE", isActive: true, monthlyPrice: 500_000, yearlyPrice: 5_000_000 };
const PLANS: Record<string, object> = { starter, pro, ent: enterprise };

const organization = { id: "org-1", slug: "nile-motors", name: "Nile Motors", email: "sales@nile.example", phone: null };
const actor = { id: "user-1", name: "Mona", email: "mona@example.com" };

// The current period: 1 Oct – 1 Nov 2026.
const period = periodFrom("2026-10-01", "MONTHLY");

const subscription = (overrides: Record<string, unknown> = {}) => ({
  id: "sub-1",
  organizationId: "org-1",
  planId: "pro",
  plan: pro,
  status: "ACTIVE",
  billingPeriod: "MONTHLY",
  currentPeriodStart: period.start,
  currentPeriodEnd: period.end,
  pendingPlanId: null,
  pendingPlan: null,
  pendingBillingPeriod: null,
  cancelAtPeriodEnd: false,
  ...overrides,
});

const given = (overrides: Record<string, unknown> = {}) =>
  vi.mocked(billingRepo.findSubscriptionByOrgId).mockResolvedValue(subscription(overrides) as never);

const change = (planId: string, billingPeriod: "MONTHLY" | "YEARLY" = "MONTHLY") =>
  changePlan({ organization, actor, planId, billingPeriod, locale: "en" });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(billingRepo.findPlanById).mockImplementation(async (id) => (PLANS[id] ?? null) as never);
  vi.mocked(billingRepo.findPlanByType).mockResolvedValue(starter as never);
  vi.mocked(billingRepo.findPaidRenewalAhead).mockResolvedValue(null);
  vi.mocked(startCheckout).mockResolvedValue({ paymentId: "payment-1", url: "https://paymob.example/checkout" });
});

describe("changePlan", () => {
  it("opens an upgrade checkout for a higher plan, changing nothing yet", async () => {
    given();
    await expect(change("ent", "YEARLY")).resolves.toEqual({ type: "redirect", url: "https://paymob.example/checkout" });
    expect(startCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ purpose: "UPGRADE", planId: "ent", billingPeriod: "YEARLY", organizationSlug: "nile-motors" })
    );
    expect(billingRepo.updateSubscription).not.toHaveBeenCalled();
  });

  it("schedules a downgrade for the end of the paid period", async () => {
    given({ planId: "ent", plan: enterprise });
    await expect(change("pro")).resolves.toEqual({ type: "scheduled", effectiveAt: period.end });
    expect(billingRepo.updateSubscription).toHaveBeenCalledWith("org-1", {
      pendingPlanId: "pro",
      pendingBillingPeriod: "MONTHLY",
      cancelAtPeriodEnd: false,
      canceledAt: null,
    });
    expect(startCheckout).not.toHaveBeenCalled();
  });

  it("schedules a switch to yearly on the same plan", async () => {
    given();
    await change("pro", "YEARLY");
    expect(billingRepo.updateSubscription).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({ pendingPlanId: null, pendingBillingPeriod: "YEARLY" })
    );
  });

  it("moves a trial to the free plan at once", async () => {
    given({ status: "TRIALING" });
    await expect(change("starter")).resolves.toEqual({ type: "updated" });
    expect(billingRepo.updateSubscription).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({ planId: "starter", status: "ACTIVE", currentPeriodEnd: null })
    );
  });

  it("refuses the plan the dealership is already on", async () => {
    given();
    const error = await change("pro").catch((e: unknown) => e);
    expect((error as ValidationError).messageKey).toBe("errors.billing.alreadyOnPlan");
  });

  it("refuses any change once the next period is paid", async () => {
    given({ planId: "ent", plan: enterprise });
    vi.mocked(billingRepo.findPaidRenewalAhead).mockResolvedValue({ id: "renewal-1" } as never);
    for (const target of ["pro", "starter"]) {
      const error = await change(target).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ConflictError);
      expect((error as ConflictError).messageKey).toBe("errors.billing.renewalAlreadyPaid");
    }
    given();
    await expect(change("ent")).rejects.toBeInstanceOf(ConflictError);
    expect(startCheckout).not.toHaveBeenCalled();
    expect(billingRepo.updateSubscription).not.toHaveBeenCalled();
  });
});

describe("payRenewal", () => {
  const pay = (now: string) => payRenewal({ organization, actor, locale: "ar", now: new Date(now) });

  it("is refused while the period has more than a week left", async () => {
    given();
    await expect(pay("2026-10-10T09:00:00Z")).rejects.toBeInstanceOf(ValidationError);
    expect(startCheckout).not.toHaveBeenCalled();
  });

  it("opens a renewal checkout from a week before the end", async () => {
    given();
    await expect(pay("2026-10-26T09:00:00Z")).resolves.toEqual({ url: "https://paymob.example/checkout" });
    expect(startCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ purpose: "RENEWAL", planId: "pro", billingPeriod: "MONTHLY", locale: "ar" })
    );
  });

  it("renews into a scheduled downgrade and period", async () => {
    given({ planId: "ent", plan: enterprise, pendingPlanId: "pro", pendingPlan: pro, pendingBillingPeriod: "YEARLY" });
    await pay("2026-10-30T09:00:00Z");
    expect(startCheckout).toHaveBeenCalledWith(expect.objectContaining({ planId: "pro", billingPeriod: "YEARLY" }));
  });

  it("is open throughout a trial, and in the grace after the end", async () => {
    given({ status: "TRIALING" });
    await pay("2026-10-05T09:00:00Z");
    given({ status: "PAST_DUE" });
    await pay("2026-11-04T09:00:00Z");
    expect(startCheckout).toHaveBeenCalledTimes(2);
  });

  it("is refused twice over: the next period already paid, or a move to the free plan scheduled", async () => {
    given();
    vi.mocked(billingRepo.findPaidRenewalAhead).mockResolvedValue({ id: "renewal-1" } as never);
    await expect(pay("2026-10-28T09:00:00Z")).rejects.toBeInstanceOf(ConflictError);

    vi.mocked(billingRepo.findPaidRenewalAhead).mockResolvedValue(null);
    given({ pendingPlanId: "starter", pendingPlan: starter });
    await expect(pay("2026-10-28T09:00:00Z")).rejects.toBeInstanceOf(ValidationError);
    expect(startCheckout).not.toHaveBeenCalled();
  });
});

describe("cancelPlan and keepCurrentPlan", () => {
  it("cancels at the period end, keeping the plan until then", async () => {
    given({ pendingPlanId: "starter" });
    await expect(cancelPlan({ organization, actor, now: new Date("2026-10-10T09:00:00Z") })).resolves.toEqual({
      type: "scheduled",
      effectiveAt: period.end,
    });
    expect(billingRepo.updateSubscription).toHaveBeenCalledWith("org-1", {
      cancelAtPeriodEnd: true,
      canceledAt: new Date("2026-10-10T09:00:00Z"),
      pendingPlanId: null,
      pendingBillingPeriod: null,
    });
  });

  it("moves a past-due dealership to the free plan now: nothing was paid", async () => {
    given({ status: "PAST_DUE" });
    await expect(cancelPlan({ organization, actor })).resolves.toEqual({ type: "updated" });
    expect(billingRepo.updateSubscription).toHaveBeenCalledWith("org-1", expect.objectContaining({ planId: "starter" }));
  });

  it("refuses on the free plan, and once the next period is paid", async () => {
    given({ planId: "starter", plan: starter });
    await expect(cancelPlan({ organization, actor })).rejects.toBeInstanceOf(ValidationError);
    given();
    vi.mocked(billingRepo.findPaidRenewalAhead).mockResolvedValue({ id: "renewal-1" } as never);
    await expect(cancelPlan({ organization, actor })).rejects.toBeInstanceOf(ConflictError);
  });

  it("keeps the current plan by clearing whatever was scheduled", async () => {
    given({ cancelAtPeriodEnd: true });
    await keepCurrentPlan({ organization });
    expect(billingRepo.updateSubscription).toHaveBeenCalledWith("org-1", {
      cancelAtPeriodEnd: false,
      canceledAt: null,
      pendingPlanId: null,
      pendingBillingPeriod: null,
    });
  });
});
