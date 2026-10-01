import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/repositories/billing", () => ({
  findPlanByType: vi.fn(),
  findSubscriptionsEndingBy: vi.fn(),
  findPaidRenewalAhead: vi.fn(),
  updateSubscription: vi.fn(),
  findStalePendingPayments: vi.fn(),
  markPaymentExpired: vi.fn(),
}));
vi.mock("@/lib/services/billing/notices", () => ({ emailOwners: vi.fn() }));
vi.mock("@/lib/services/paymob", () => ({ findTransactionByReference: vi.fn() }));
vi.mock("@/lib/services/billing/settle", () => ({ settlePayment: vi.fn() }));
vi.mock("@/lib/services/audit/audit", () => ({
  auditHelpers: { logSubscriptionChanged: vi.fn(async () => null) },
}));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils/errors")>()),
  logError: vi.fn(),
}));

import * as billingRepo from "@/lib/repositories/billing";
import { emailOwners } from "@/lib/services/billing/notices";
import { findTransactionByReference } from "@/lib/services/paymob";
import { settlePayment } from "@/lib/services/billing/settle";
import { runBillingRenewals } from "@/lib/services/billing/renewals";
import { periodFrom } from "@/lib/services/billing/periods";
import { cairoMidnight } from "@/lib/utils/date-only";

const starter = { id: "starter", type: "STARTER", name: "Starter", monthlyPrice: 0, yearlyPrice: 0 };
const pro = { id: "pro", type: "PRO", name: "Pro", monthlyPrice: 150_000, yearlyPrice: 1_500_000 };

// The current period: 1 Oct – 1 Nov 2026 (ends 22:00 UTC, 31 Oct).
const period = periodFrom("2026-10-01", "MONTHLY");
const november = periodFrom("2026-11-01", "MONTHLY");
// Noon in Cairo on a date (UTC+2 from 30 Oct).
const noon = (date: string, offset = 2) => new Date(new Date(`${date}T12:00:00Z`).getTime() - offset * 3_600_000);

const subscription = (overrides: Record<string, unknown> = {}) => ({
  id: "sub-1",
  organizationId: "org-1",
  organization: { id: "org-1", deletedAt: null },
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

const given = (...subs: ReturnType<typeof subscription>[]) =>
  vi.mocked(billingRepo.findSubscriptionsEndingBy).mockResolvedValue(subs as never);

const run = (now: Date, deadline = Date.now() + 60_000) => runBillingRenewals(now, { deadline });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(billingRepo.findPlanByType).mockResolvedValue(starter as never);
  vi.mocked(billingRepo.findPaidRenewalAhead).mockResolvedValue(null);
  vi.mocked(billingRepo.findStalePendingPayments).mockResolvedValue([]);
  vi.mocked(emailOwners).mockResolvedValue(1);
  given();
});

describe("renewal emails", () => {
  it("asks a week before the end, once per period through the ledger", async () => {
    given(subscription());
    const report = await run(noon("2026-10-25", 3)); // 7 days left

    expect(emailOwners).toHaveBeenCalledWith(
      "org-1",
      { kind: "renewalDue", plan: pro, amountCents: 150_000, period: "MONTHLY", endsAt: period.end },
      { kind: "renewal_due", periodEnd: period.end }
    );
    expect(report.reminded).toBe(1);
    expect(billingRepo.updateSubscription).not.toHaveBeenCalled();
  });

  it("reminds three days before, for the plan and period coming next", async () => {
    given(subscription({ pendingPlan: { ...pro, id: "pro-2" }, pendingBillingPeriod: "YEARLY" }));
    await run(noon("2026-10-29", 3)); // 3 days left
    expect(emailOwners).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({ kind: "renewalReminder", amountCents: 1_500_000, period: "YEARLY" }),
      { kind: "renewal_reminder", periodEnd: period.end }
    );
  });

  it("words a trial's emails as a trial ending", async () => {
    given(subscription({ status: "TRIALING" }));
    await run(noon("2026-10-25", 3));
    expect(emailOwners).toHaveBeenCalledWith("org-1", expect.objectContaining({ kind: "trialDue" }), expect.anything());
  });

  it("sends nothing more than a week out, for a plan set to end, or once the next period is paid", async () => {
    given(subscription());
    await run(noon("2026-10-20", 3));
    given(subscription({ cancelAtPeriodEnd: true }), subscription({ pendingPlan: starter }));
    await run(noon("2026-10-28", 3));
    given(subscription());
    vi.mocked(billingRepo.findPaidRenewalAhead).mockResolvedValue({ id: "renewal-1" } as never);
    await run(noon("2026-10-28", 3));
    expect(emailOwners).not.toHaveBeenCalled();
  });
});

describe("when a period ends", () => {
  it("moves onto the renewal paid ahead for it", async () => {
    given(subscription({ status: "ACTIVE" }));
    vi.mocked(billingRepo.findPaidRenewalAhead).mockResolvedValue({
      id: "renewal-1",
      periodStart: november.start,
      periodEnd: november.end,
      billingPeriod: "MONTHLY",
      plan: { id: "pro", name: "Pro", type: "PRO" },
    } as never);

    const report = await run(noon("2026-11-01"));

    expect(billingRepo.updateSubscription).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({
        planId: "pro",
        status: "ACTIVE",
        currentPeriodStart: november.start,
        currentPeriodEnd: november.end,
        pendingPlanId: null,
      })
    );
    expect(report.rolledOver).toBe(1);
    expect(emailOwners).not.toHaveBeenCalled();
  });

  it("turns an unpaid period past due, emailing the last day to pay", async () => {
    given(subscription());
    const now = noon("2026-11-01");
    const report = await run(now);

    expect(billingRepo.updateSubscription).toHaveBeenCalledWith("org-1", { status: "PAST_DUE", pastDueSince: now });
    expect(emailOwners).toHaveBeenCalledWith(
      "org-1",
      { kind: "pastDue", plan: pro, payBy: cairoMidnight("2026-11-08") },
      { kind: "past_due", periodEnd: period.end }
    );
    expect(report.pastDue).toBe(1);
  });

  it("leaves a past-due subscription alone during the grace", async () => {
    given(subscription({ status: "PAST_DUE" }));
    await run(noon("2026-11-05"));
    expect(billingRepo.updateSubscription).not.toHaveBeenCalled();
  });

  it("moves to the free plan after the grace", async () => {
    given(subscription({ status: "PAST_DUE" }));
    const now = noon("2026-11-08");
    const report = await run(now);

    expect(billingRepo.updateSubscription).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({ planId: "starter", status: "ACTIVE", currentPeriodEnd: null, pastDueSince: null })
    );
    expect(emailOwners).toHaveBeenCalledWith(
      "org-1",
      { kind: "downgradedUnpaid", plan: pro },
      { kind: "downgraded", periodEnd: period.end }
    );
    expect(report.downgraded).toBe(1);
  });

  it("moves a canceled plan to the free plan at once, without a grace", async () => {
    given(subscription({ cancelAtPeriodEnd: true }));
    await run(noon("2026-11-01"));
    expect(billingRepo.updateSubscription).toHaveBeenCalledWith("org-1", expect.objectContaining({ planId: "starter" }));
    expect(emailOwners).toHaveBeenCalledWith("org-1", { kind: "downgradedCanceled", plan: pro }, expect.anything());
  });

  it("skips the free plan and deleted dealerships", async () => {
    given(
      subscription({ plan: starter, planId: "starter" }),
      subscription({ organization: { id: "org-1", deletedAt: new Date() } })
    );
    await run(noon("2026-11-10"));
    expect(billingRepo.updateSubscription).not.toHaveBeenCalled();
  });

  it("keeps going past one dealership that fails", async () => {
    given(subscription({ organizationId: "org-bad" }), subscription({ organizationId: "org-2" }));
    vi.mocked(billingRepo.updateSubscription).mockRejectedValueOnce(new Error("db"));
    const report = await run(noon("2026-11-01"));
    expect(report.failed).toBe(1);
    expect(report.pastDue).toBe(1);
  });

  it("stops at its deadline and leaves the rest to the next run", async () => {
    given(subscription());
    const report = await run(noon("2026-11-01"), Date.now() - 1);
    expect(report.stoppedEarly).toBe(true);
    expect(billingRepo.updateSubscription).not.toHaveBeenCalled();
  });
});

describe("payments the callback never reported", () => {
  const now = noon("2026-11-01");
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000);

  it("settles what Paymob says was paid", async () => {
    vi.mocked(billingRepo.findStalePendingPayments).mockResolvedValue([{ id: "p1", createdAt: ago(30) }]);
    vi.mocked(findTransactionByReference).mockResolvedValue({ id: 9001 } as never);
    vi.mocked(settlePayment).mockResolvedValue({ status: "paid" } as never);

    const report = await run(now);
    expect(settlePayment).toHaveBeenCalledWith("p1", { id: 9001 }, now);
    expect(report.paymentsSettled).toBe(1);
  });

  it("expires a checkout nobody paid after two hours, and waits on a younger one", async () => {
    vi.mocked(billingRepo.findStalePendingPayments).mockResolvedValue([
      { id: "old", createdAt: ago(180) },
      { id: "young", createdAt: ago(30) },
    ]);
    vi.mocked(findTransactionByReference).mockResolvedValue(null);
    vi.mocked(billingRepo.markPaymentExpired).mockResolvedValue(true);

    const report = await run(now);
    expect(billingRepo.markPaymentExpired).toHaveBeenCalledTimes(1);
    expect(billingRepo.markPaymentExpired).toHaveBeenCalledWith("old");
    expect(report.paymentsExpired).toBe(1);
  });
});
