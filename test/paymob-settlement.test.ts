import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// Point the app's Prisma client at the throwaway test database before it is
// imported. Runs in vi.hoisted so it beats the hoisted import of @/lib/prisma.
vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
});

// Side effects outside the database: storage, request-scoped audit metadata, email.
vi.mock("@/lib/services/onboarding/logo", () => ({ resolveLogoUrl: vi.fn(async () => null) }));
vi.mock("@/lib/services/audit/audit", () => ({
  auditHelpers: { logOrgCreated: vi.fn(), logSubscriptionChanged: vi.fn() },
}));
vi.mock("@/lib/services/notification", () => ({ sendWelcomeEmail: vi.fn(async () => null) }));

const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);

import { db } from "@/lib/prisma";
import { settlePayment } from "@/lib/services/billing/settle";
import type { PaymobTransaction } from "@/lib/services/paymob";

const RUN = `paymob-test-${Date.now()}`;
const SLUG = `${RUN}-motors`;

const paidTx = (paymentId: string, amount: number): PaymobTransaction => ({
  id: Date.now(),
  amount_cents: amount,
  created_at: "2026-10-15T12:00:00.000000",
  currency: "EGP",
  success: true,
  pending: false,
  error_occured: false,
  has_parent_transaction: false,
  integration_id: 1,
  is_3d_secure: true,
  is_auth: false,
  is_capture: false,
  is_refunded: false,
  is_standalone_payment: true,
  is_voided: false,
  owner: 1,
  order: { id: 1, merchant_order_id: paymentId },
  source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
});

// The success page and the callback settle the same payment at the same
// moment. The compare-and-set on Payment.status must let exactly one of them
// create the dealership; a mocked client cannot show that, only Postgres can.
describe.skipIf(!hasTestDb)("settlePayment against Postgres", () => {
  let userId: string;
  let planId: string;
  let paymentId: string;

  beforeAll(async () => {
    const plan = await db.plan.upsert({
      where: { type: "PRO" },
      update: {},
      create: { name: "Pro", type: "PRO", monthlyPrice: 150_000, yearlyPrice: 1_500_000, features: {} },
    });
    planId = plan.id;

    const user = await db.user.create({ data: { clerkId: `${RUN}-clerk`, email: `${RUN}@example.com` } });
    userId = user.id;

    const session = await db.onboardingSession.create({
      data: {
        userId,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 3_600_000),
        data: { name: "Race Motors", slug: SLUG, email: `${RUN}@example.com`, planId },
      },
    });

    const payment = await db.payment.create({
      data: {
        purpose: "SIGNUP",
        planId,
        billingPeriod: "MONTHLY",
        amountCents: plan.monthlyPrice,
        userId,
        onboardingSessionId: session.id,
      },
    });
    paymentId = payment.id;
  });

  afterAll(async () => {
    await db.payment.deleteMany({ where: { userId } });
    await db.organization.deleteMany({ where: { slug: { startsWith: RUN } } });
    await db.user.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  });

  it("creates the dealership exactly once when two settlements race", async () => {
    const payment = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const tx = paidTx(paymentId, payment.amountCents);

    const results = await Promise.all([settlePayment(paymentId, tx), settlePayment(paymentId, tx)]);

    expect(results.map((r) => r.status).sort()).toEqual(["already_paid", "paid"]);
    expect(await db.organization.count({ where: { slug: { startsWith: RUN } } })).toBe(1);

    const settled = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });
    expect(settled.status).toBe("PAID");
    expect(settled.organizationId).not.toBeNull();
    expect(settled.periodEnd!.getTime()).toBeGreaterThan(settled.periodStart!.getTime());

    const org = await db.organization.findUniqueOrThrow({
      where: { id: settled.organizationId! },
      include: { subscription: true, memberships: true },
    });
    expect(org.subscription).toMatchObject({ planId, status: "ACTIVE", billingPeriod: "MONTHLY" });
    expect(org.memberships).toEqual([expect.objectContaining({ userId, role: "OWNER" })]);
    expect(
      (await db.onboardingSession.findFirstOrThrow({ where: { userId } })).status
    ).toBe("COMPLETED");
  });

  it("does nothing on a repeat after the payment is settled", async () => {
    const payment = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const result = await settlePayment(paymentId, paidTx(paymentId, payment.amountCents));
    expect(result.status).toBe("already_paid");
    expect(await db.organization.count({ where: { slug: { startsWith: RUN } } })).toBe(1);
  });
});
