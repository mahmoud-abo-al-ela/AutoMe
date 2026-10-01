import { describe, it, expect, vi, beforeEach } from "vitest";

const tx = { marker: "tx" };

vi.mock("@/lib/prisma", () => ({
  db: { $transaction: vi.fn((fn: (client: unknown) => unknown) => fn(tx)) },
}));
vi.mock("@/lib/repositories/payment", () => ({
  findPaymentForSettlement: vi.fn(),
  markPaymentFailed: vi.fn(),
  claimPaymentAsPaid: vi.fn(),
  recordPaymentPeriod: vi.fn(),
  updateSubscriptionInTx: vi.fn(),
  isSlugTaken: vi.fn(),
  completeOnboardingSessionInTx: vi.fn(),
  findOnboardingSessionData: vi.fn(),
}));
vi.mock("@/lib/services/onboarding/creation", () => ({ createOrganizationRecords: vi.fn() }));
vi.mock("@/lib/services/onboarding/logo", () => ({ resolveLogoUrl: vi.fn() }));
vi.mock("@/lib/services/audit/audit", () => ({
  auditHelpers: { logOrgCreated: vi.fn(), logSubscriptionChanged: vi.fn() },
}));
vi.mock("@/lib/services/notification", () => ({ sendWelcomeEmail: vi.fn() }));
vi.mock("@/lib/services/billing/notices", () => ({ emailOwners: vi.fn(async () => 1) }));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/utils/errors")>()),
  logError: vi.fn(),
}));

import * as paymentRepo from "@/lib/repositories/payment";
import { createOrganizationRecords } from "@/lib/services/onboarding/creation";
import { resolveLogoUrl } from "@/lib/services/onboarding/logo";
import { sendWelcomeEmail } from "@/lib/services/notification";
import { emailOwners } from "@/lib/services/billing/notices";
import { db } from "@/lib/prisma";
import { settlePayment, SettlementError } from "@/lib/services/billing/settle";
import { periodFrom } from "@/lib/services/billing/periods";
import type { PaymobTransaction } from "@/lib/services/paymob";

// Noon in Cairo, 15 Oct 2026 (UTC+3).
const NOW = new Date("2026-10-15T09:00:00Z");

const paidTx: PaymobTransaction = {
  id: 9001,
  amount_cents: 150_000,
  created_at: "2026-10-15T12:00:00.000000",
  currency: "EGP",
  success: true,
  pending: false,
  error_occured: false,
  has_parent_transaction: false,
  integration_id: 5123456,
  is_3d_secure: true,
  is_auth: false,
  is_capture: false,
  is_refunded: false,
  is_standalone_payment: true,
  is_voided: false,
  owner: 1,
  order: { id: 622803589, merchant_order_id: "payment-1" },
  source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
};

const proPlan = { id: "plan-pro", monthlyPrice: 150_000, yearlyPrice: 1_500_000 };
const enterprisePlan = { id: "plan-ent", monthlyPrice: 500_000, yearlyPrice: 5_000_000 };
const starterPlan = { id: "plan-starter", monthlyPrice: 0, yearlyPrice: 0 };

const subscription = (overrides: Record<string, unknown> = {}) => ({
  id: "sub-1",
  organizationId: "org-1",
  planId: "plan-pro",
  plan: proPlan,
  status: "ACTIVE",
  // The current period: 1 Oct – 1 Nov 2026.
  currentPeriodStart: periodFrom("2026-10-01", "MONTHLY").start,
  currentPeriodEnd: periodFrom("2026-10-01", "MONTHLY").end,
  ...overrides,
});

const payment = (overrides: Record<string, unknown> = {}) => ({
  id: "payment-1",
  purpose: "UPGRADE",
  status: "PENDING",
  planId: "plan-pro",
  billingPeriod: "MONTHLY",
  amountCents: 150_000,
  currency: "EGP",
  userId: "user-1",
  user: { email: "mona@example.com", name: "Mona" },
  plan: { id: "plan-pro", type: "PRO", name: "Pro" },
  organizationId: "org-1",
  onboardingSessionId: null,
  organization: { id: "org-1", subscription: subscription() },
  ...overrides,
});

const sessionData = {
  name: "Nile Motors",
  slug: "nile-motors",
  email: "sales@nile.example",
  phone: "01001234567",
  logo: "data:image/png;base64,AAAA",
  workingHours: { monday: { open: "09:00", close: "17:00", closed: false } },
  planId: "plan-pro",
};

const given = (p: ReturnType<typeof payment>) =>
  vi.mocked(paymentRepo.findPaymentForSettlement).mockResolvedValue(p as never);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(paymentRepo.claimPaymentAsPaid).mockResolvedValue(true);
  vi.mocked(paymentRepo.isSlugTaken).mockResolvedValue(false);
  vi.mocked(resolveLogoUrl).mockResolvedValue("https://cdn.example/logo.png");
  vi.mocked(sendWelcomeEmail).mockResolvedValue(null as never);
  vi.mocked(createOrganizationRecords).mockImplementation(
    async (_tx, details) => ({ id: "org-new", slug: details.slug }) as never
  );
});

describe("settlePayment — what is never applied", () => {
  it("ignores refunds and other child transactions, whatever they say", async () => {
    const result = await settlePayment("payment-1", { ...paidTx, has_parent_transaction: true }, NOW);
    expect(result).toEqual({ status: "ignored", reason: "child_transaction" });
    expect(paymentRepo.findPaymentForSettlement).not.toHaveBeenCalled();
  });

  it("ignores a reference that is not one of our payments", async () => {
    vi.mocked(paymentRepo.findPaymentForSettlement).mockResolvedValue(null);
    expect(await settlePayment("nope", paidTx, NOW)).toEqual({ status: "ignored", reason: "unknown_payment" });
  });

  it("rejects a transaction that names another payment", async () => {
    given(payment());
    const tx2 = { ...paidTx, order: { id: 1, merchant_order_id: "payment-2" } };
    expect(await settlePayment("payment-1", tx2, NOW)).toMatchObject({ status: "rejected", reason: "reference_mismatch" });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("rejects a paid amount or currency that differs from the payment", async () => {
    given(payment());
    expect(await settlePayment("payment-1", { ...paidTx, amount_cents: 100 }, NOW)).toMatchObject({
      status: "rejected",
      reason: "amount_mismatch",
    });
    expect(await settlePayment("payment-1", { ...paidTx, currency: "USD" }, NOW)).toMatchObject({
      status: "rejected",
      reason: "currency_mismatch",
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("does nothing for a payment that is already paid", async () => {
    given(payment({ status: "PAID" }));
    expect(await settlePayment("payment-1", paidTx, NOW)).toEqual({
      status: "already_paid",
      paymentId: "payment-1",
      organizationId: "org-1",
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("waits on a pending transaction", async () => {
    given(payment());
    expect(await settlePayment("payment-1", { ...paidTx, pending: true }, NOW)).toMatchObject({ status: "pending" });
    expect(paymentRepo.markPaymentFailed).not.toHaveBeenCalled();
  });

  it("records a declined card as failed, with its transaction", async () => {
    given(payment());
    const declined = { ...paidTx, success: false };
    expect(await settlePayment("payment-1", declined, NOW)).toMatchObject({ status: "failed" });
    expect(paymentRepo.markPaymentFailed).toHaveBeenCalledWith("payment-1", {
      providerTransactionId: "9001",
      method: "card",
      maskedPan: "2346",
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("applies nothing when another settlement won the race", async () => {
    given(payment());
    vi.mocked(paymentRepo.claimPaymentAsPaid).mockResolvedValue(false);
    expect(await settlePayment("payment-1", paidTx, NOW)).toMatchObject({ status: "already_paid" });
    expect(paymentRepo.updateSubscriptionInTx).not.toHaveBeenCalled();
    expect(paymentRepo.recordPaymentPeriod).not.toHaveBeenCalled();
  });
});

describe("settlePayment — sign-up", () => {
  beforeEach(() => {
    given(
      payment({
        purpose: "SIGNUP",
        organizationId: null,
        organization: null,
        onboardingSessionId: "session-1",
      })
    );
    vi.mocked(paymentRepo.findOnboardingSessionData).mockResolvedValue({
      id: "session-1",
      data: sessionData,
      status: "EXPIRED",
    } as never);
  });

  it("creates the dealership with a month starting today, inside the payment's transaction", async () => {
    const result = await settlePayment("payment-1", paidTx, NOW);

    expect(result).toEqual({ status: "paid", paymentId: "payment-1", purpose: "SIGNUP", organizationId: "org-new" });
    expect(paymentRepo.claimPaymentAsPaid).toHaveBeenCalledWith(tx, "payment-1", {
      providerTransactionId: "9001",
      method: "card",
      maskedPan: "2346",
      paidAt: NOW,
    });

    const month = periodFrom("2026-10-15", "MONTHLY");
    expect(createOrganizationRecords).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ name: "Nile Motors", slug: "nile-motors", logoUrl: "https://cdn.example/logo.png" }),
      "user-1",
      {
        planId: "plan-pro",
        status: "ACTIVE",
        billingPeriod: "MONTHLY",
        currentPeriodStart: month.start,
        currentPeriodEnd: month.end,
      }
    );
    expect(paymentRepo.completeOnboardingSessionInTx).toHaveBeenCalledWith(tx, "session-1");
    expect(paymentRepo.recordPaymentPeriod).toHaveBeenCalledWith(tx, "payment-1", {
      organizationId: "org-new",
      periodStart: month.start,
      periodEnd: month.end,
    });
    expect(sendWelcomeEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "mona@example.com" }));
  });

  it("takes the next free slug when the chosen one went in the meantime", async () => {
    vi.mocked(paymentRepo.isSlugTaken).mockImplementation(async (_tx, slug) => slug === "nile-motors");
    await settlePayment("payment-1", paidTx, NOW);
    expect(createOrganizationRecords).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ slug: "nile-motors-2" }),
      "user-1",
      expect.anything()
    );
    expect(sendWelcomeEmail).toHaveBeenCalledWith(
      expect.objectContaining({ dashboardUrl: expect.stringContaining("/org/nile-motors-2/dashboard") })
    );
  });

  it("creates the dealership without a logo when the upload fails", async () => {
    vi.mocked(resolveLogoUrl).mockRejectedValue(new Error("storage down"));
    await settlePayment("payment-1", paidTx, NOW);
    expect(createOrganizationRecords).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ logoUrl: null }),
      "user-1",
      expect.anything()
    );
  });

  it("throws, for a person to look at, when the onboarding session is gone", async () => {
    vi.mocked(paymentRepo.findOnboardingSessionData).mockResolvedValue(null);
    await expect(settlePayment("payment-1", paidTx, NOW)).rejects.toBeInstanceOf(SettlementError);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
});

describe("settlePayment — upgrade", () => {
  it("switches the plan now and starts a new period today, clearing anything pending", async () => {
    given(payment({ purpose: "UPGRADE", planId: "plan-ent", amountCents: 5_000_000, billingPeriod: "YEARLY" }));
    await settlePayment("payment-1", { ...paidTx, amount_cents: 5_000_000 }, NOW);

    const year = periodFrom("2026-10-15", "YEARLY");
    expect(paymentRepo.updateSubscriptionInTx).toHaveBeenCalledWith(tx, "org-1", {
      status: "ACTIVE",
      pendingPlanId: null,
      pendingBillingPeriod: null,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      pastDueSince: null,
      trialEndsAt: null,
      planId: "plan-ent",
      billingPeriod: "YEARLY",
      currentPeriodStart: year.start,
      currentPeriodEnd: year.end,
    });
  });
});

describe("settlePayment — renewal", () => {
  const november = periodFrom("2026-11-01", "MONTHLY");

  it("paid ahead: buys the next period but leaves the current one running", async () => {
    // A downgrade to Pro is waiting; the Enterprise period runs to 1 Nov.
    given(
      payment({
        purpose: "RENEWAL",
        organization: { id: "org-1", subscription: subscription({ planId: "plan-ent", plan: enterprisePlan }) },
      })
    );
    await settlePayment("payment-1", paidTx, new Date("2026-10-28T09:00:00Z"));

    expect(paymentRepo.updateSubscriptionInTx).toHaveBeenCalledWith(tx, "org-1", {
      cancelAtPeriodEnd: false,
      canceledAt: null,
    });
    expect(paymentRepo.recordPaymentPeriod).toHaveBeenCalledWith(tx, "payment-1", {
      organizationId: "org-1",
      periodStart: november.start,
      periodEnd: november.end,
    });
  });

  it("in the grace: continues from the old end and takes effect now", async () => {
    given(payment({ purpose: "RENEWAL", organization: { id: "org-1", subscription: subscription({ status: "PAST_DUE" }) } }));
    await settlePayment("payment-1", paidTx, new Date("2026-11-04T09:00:00Z"));

    expect(paymentRepo.updateSubscriptionInTx).toHaveBeenCalledWith(
      tx,
      "org-1",
      expect.objectContaining({
        status: "ACTIVE",
        pastDueSince: null,
        planId: "plan-pro",
        currentPeriodStart: november.start,
        currentPeriodEnd: november.end,
      })
    );
  });

  it("after the drop to the free plan: a fresh period from today", async () => {
    given(
      payment({
        purpose: "RENEWAL",
        organization: { id: "org-1", subscription: subscription({ planId: "plan-starter", plan: starterPlan }) },
      })
    );
    await settlePayment("payment-1", paidTx, new Date("2026-11-20T09:00:00Z"));

    const fresh = periodFrom("2026-11-20", "MONTHLY");
    expect(paymentRepo.updateSubscriptionInTx).toHaveBeenCalledWith(
      tx,
      "org-1",
      expect.objectContaining({ planId: "plan-pro", currentPeriodStart: fresh.start, currentPeriodEnd: fresh.end })
    );
  });
});

describe("settlePayment — the owners' emails", () => {
  it("emails a declined renewal or upgrade once, and never for a sign-up", async () => {
    given(payment({ purpose: "RENEWAL" }));
    vi.mocked(paymentRepo.markPaymentFailed).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await settlePayment("payment-1", { ...paidTx, success: false }, NOW);
    await settlePayment("payment-1", { ...paidTx, success: false }, NOW); // already failed
    expect(emailOwners).toHaveBeenCalledTimes(1);
    expect(emailOwners).toHaveBeenCalledWith("org-1", {
      kind: "paymentFailed",
      plan: { id: "plan-pro", type: "PRO", name: "Pro" },
      amountCents: 150_000,
    });

    vi.mocked(emailOwners).mockClear();
    given(payment({ purpose: "SIGNUP", organizationId: null, organization: null }));
    vi.mocked(paymentRepo.markPaymentFailed).mockResolvedValue(true);
    await settlePayment("payment-1", { ...paidTx, success: false }, NOW);
    expect(emailOwners).not.toHaveBeenCalled();
  });

  it("confirms an upgrade's payment, paid until the new period ends", async () => {
    given(payment());
    await settlePayment("payment-1", paidTx, NOW);
    expect(emailOwners).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({
        kind: "paymentReceived",
        until: periodFrom("2026-10-15", "MONTHLY").end,
        startsOn: null,
      })
    );
  });

  it("says when a renewal paid ahead starts", async () => {
    given(payment({ purpose: "RENEWAL" }));
    await settlePayment("payment-1", paidTx, new Date("2026-10-28T09:00:00Z"));
    const november = periodFrom("2026-11-01", "MONTHLY");
    expect(emailOwners).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({ kind: "paymentReceived", until: november.end, startsOn: november.start })
    );
  });
});
