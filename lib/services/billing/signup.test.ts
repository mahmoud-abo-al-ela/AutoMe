import { describe, it, expect, vi, beforeEach } from "vitest";

const tx = { marker: "tx" };

vi.mock("@/lib/prisma", () => ({
  db: { $transaction: vi.fn((fn: (client: unknown) => unknown) => fn(tx)) },
}));
vi.mock("@/lib/repositories/billing", () => ({ findPlanById: vi.fn() }));
vi.mock("@/lib/repositories/user", () => ({ findUserOwnedOrganization: vi.fn() }));
vi.mock("@/lib/repositories/payment", () => ({ isSlugTaken: vi.fn() }));
vi.mock("@/lib/services/onboarding/creation", () => ({ createOrganizationRecords: vi.fn() }));
vi.mock("@/lib/services/onboarding/logo", () => ({ resolveLogoUrl: vi.fn() }));
vi.mock("@/lib/services/onboarding/session", () => ({ getOnboardingSessionForUser: vi.fn() }));
vi.mock("@/lib/services/audit/audit", () => ({ auditHelpers: { logOrgCreated: vi.fn() } }));
vi.mock("@/lib/services/notification", () => ({ sendWelcomeEmail: vi.fn() }));
vi.mock("@/lib/services/billing/checkout", () => ({ startCheckout: vi.fn() }));

import * as billingRepo from "@/lib/repositories/billing";
import { findUserOwnedOrganization } from "@/lib/repositories/user";
import { isSlugTaken } from "@/lib/repositories/payment";
import { createOrganizationRecords } from "@/lib/services/onboarding/creation";
import { resolveLogoUrl } from "@/lib/services/onboarding/logo";
import { getOnboardingSessionForUser } from "@/lib/services/onboarding/session";
import { sendWelcomeEmail } from "@/lib/services/notification";
import { startCheckout } from "@/lib/services/billing/checkout";
import { createUnpaidOrganization, startSignupCheckout } from "@/lib/services/billing/signup";
import { trialPeriod } from "@/lib/services/billing/periods";
import { planSignupKind } from "@/lib/utils/plan-signup";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/utils/errors";

const NOW = new Date("2026-10-15T09:00:00Z");

const starter = { id: "plan-starter", type: "STARTER", isActive: true, monthlyPrice: 0, yearlyPrice: 0, trialDays: 0 };
const pro = { id: "plan-pro", type: "PRO", isActive: true, monthlyPrice: 150_000, yearlyPrice: 1_500_000, trialDays: 0 };
const proTrial = { ...pro, trialDays: 14 };

const user = { id: "user-1", name: "Mona", email: "mona@example.com" };
const details = { name: "Nile Motors", slug: "nile-motors", email: "sales@nile.example", phone: "01001234567" };

const plan = (p: object) => vi.mocked(billingRepo.findPlanById).mockResolvedValue(p as never);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(findUserOwnedOrganization).mockResolvedValue(null);
  vi.mocked(isSlugTaken).mockResolvedValue(false);
  vi.mocked(resolveLogoUrl).mockResolvedValue(null);
  vi.mocked(sendWelcomeEmail).mockResolvedValue(null as never);
  vi.mocked(createOrganizationRecords).mockResolvedValue({ id: "org-1", name: "Nile Motors", slug: "nile-motors" } as never);
});

describe("planSignupKind", () => {
  it("is free without a price, a trial with trial days, otherwise paid", () => {
    expect(planSignupKind(starter)).toBe("free");
    expect(planSignupKind(pro)).toBe("paid");
    expect(planSignupKind(proTrial)).toBe("trial");
    expect(planSignupKind({ ...starter, trialDays: 30 })).toBe("free");
  });
});

describe("createUnpaidOrganization", () => {
  const create = (planId: string, billingPeriod: "MONTHLY" | "YEARLY" = "MONTHLY") =>
    createUnpaidOrganization({ user, details, planId, billingPeriod, now: NOW });

  // Regression: createOrganization never checked the plan, so calling it with
  // a paid plan's id created an active paid dealership with no payment.
  it("refuses a paid plan without a trial, creating nothing", async () => {
    plan(pro);
    const error = await create("plan-pro").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).messageKey).toBe("errors.billing.checkoutRequired");
    expect(createOrganizationRecords).not.toHaveBeenCalled();
  });

  it("creates a free-plan dealership with nothing to renew", async () => {
    plan(starter);
    await create("plan-starter");
    expect(createOrganizationRecords).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ slug: "nile-motors", logoUrl: null }),
      "user-1",
      { planId: "plan-starter", status: "ACTIVE", billingPeriod: "MONTHLY", currentPeriodStart: NOW }
    );
    expect(sendWelcomeEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "mona@example.com" }));
  });

  it("starts a trial with no payment, ending after the plan's trial days", async () => {
    plan(proTrial);
    await create("plan-pro", "YEARLY");
    const trial = trialPeriod(14, NOW);
    expect(createOrganizationRecords).toHaveBeenCalledWith(tx, expect.anything(), "user-1", {
      planId: "plan-pro",
      status: "TRIALING",
      billingPeriod: "YEARLY",
      trialEndsAt: trial.end,
      currentPeriodStart: trial.start,
      currentPeriodEnd: trial.end,
    });
  });

  it("refuses a second dealership for the same owner", async () => {
    plan(proTrial);
    vi.mocked(findUserOwnedOrganization).mockResolvedValue({ id: "membership-1" } as never);
    await expect(create("plan-pro")).rejects.toBeInstanceOf(ConflictError);
    expect(createOrganizationRecords).not.toHaveBeenCalled();
  });

  it("refuses a taken slug", async () => {
    plan(starter);
    vi.mocked(isSlugTaken).mockResolvedValue(true);
    const error = await create("plan-starter").catch((e: unknown) => e);
    expect((error as ConflictError).messageKey).toBe("errors.onboarding.slugTaken");
  });

  it("refuses a retired plan", async () => {
    plan({ ...starter, isActive: false });
    await expect(create("plan-starter")).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("startSignupCheckout", () => {
  const start = (planId = "plan-pro") =>
    startSignupCheckout({ user, onboardingSessionId: "session-1", planId, billingPeriod: "MONTHLY", locale: "ar" });

  beforeEach(() => {
    vi.mocked(getOnboardingSessionForUser).mockResolvedValue({ ...details, planId: "plan-pro" } as never);
    vi.mocked(startCheckout).mockResolvedValue({ paymentId: "payment-1", url: "https://paymob.example" });
    plan(pro);
  });

  it("opens a sign-up checkout billed to the dealership being created", async () => {
    await expect(start()).resolves.toEqual({ paymentId: "payment-1", url: "https://paymob.example" });
    expect(startCheckout).toHaveBeenCalledWith({
      purpose: "SIGNUP",
      onboardingSessionId: "session-1",
      planId: "plan-pro",
      billingPeriod: "MONTHLY",
      locale: "ar",
      payer: { userId: "user-1", name: "Mona", email: "mona@example.com" },
      dealership: { name: "Nile Motors", email: "sales@nile.example", phone: "01001234567" },
    });
  });

  it("needs the caller's own, still-pending onboarding session", async () => {
    vi.mocked(getOnboardingSessionForUser).mockResolvedValue(null);
    const error = await start().catch((e: unknown) => e);
    expect((error as NotFoundError).messageKey).toBe("errors.onboarding.sessionExpired");
    expect(startCheckout).not.toHaveBeenCalled();
  });

  it("does not take payment for a free or trial plan", async () => {
    plan(proTrial);
    await expect(start()).rejects.toBeInstanceOf(ValidationError);
    plan(starter);
    await expect(start("plan-starter")).rejects.toBeInstanceOf(ValidationError);
    expect(startCheckout).not.toHaveBeenCalled();
  });

  it("does not take payment for a slug that is already taken", async () => {
    vi.mocked(isSlugTaken).mockResolvedValue(true);
    await expect(start()).rejects.toBeInstanceOf(ConflictError);
    expect(startCheckout).not.toHaveBeenCalled();
  });
});
