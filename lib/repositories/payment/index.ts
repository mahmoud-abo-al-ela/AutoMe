// Payment repository - Data access for Paymob payments and the subscription
// writes that settle them.
import type { Prisma, PaymentStatus } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

/** States a payment can still become PAID from: a late success beats a failure or an expiry. */
const UNPAID: PaymentStatus[] = ["PENDING", "FAILED", "EXPIRED"];

export async function createPayment(data: Prisma.PaymentUncheckedCreateInput) {
  return db.payment.create({ data });
}

export async function setPaymentProviderOrder(id: string, providerOrderId: string) {
  await db.payment.update({ where: { id }, data: { providerOrderId } });
}

/** The checkout never reached Paymob; the row stays as a record of the attempt. */
export async function markPaymentSetupFailed(id: string) {
  await db.payment.update({ where: { id }, data: { status: "FAILED" } });
}

/** A payment with what settling it needs: its plan and its organization's subscription. */
export async function findPaymentForSettlement(id: string) {
  return db.payment.findUnique({
    where: { id },
    include: {
      plan: true,
      user: { select: { email: true, name: true } },
      organization: { include: { subscription: { include: { plan: true } } } },
    },
  });
}

export type PaymentForSettlement = NonNullable<Awaited<ReturnType<typeof findPaymentForSettlement>>>;

/**
 * Record a declined or abandoned attempt. Never overwrites a PAID payment, so
 * a late failure callback for an earlier attempt cannot undo a success.
 */
export async function markPaymentFailed(
  id: string,
  data: Pick<Prisma.PaymentUncheckedUpdateInput, "providerTransactionId" | "method" | "maskedPan">
) {
  const { count } = await db.payment.updateMany({
    where: { id, status: { in: ["PENDING", "EXPIRED"] } },
    data: { ...data, status: "FAILED" },
  });
  return count === 1;
}

/**
 * Mark a payment PAID inside the settling transaction. A compare-and-set: of
 * two concurrent settlements (the callback and the success page), exactly one
 * gets `true` and applies the purchase; the other is a no-op.
 */
export async function claimPaymentAsPaid(
  tx: Prisma.TransactionClient,
  id: string,
  data: {
    providerTransactionId: string;
    method: string | null;
    maskedPan: string | null;
    paidAt: Date;
  }
) {
  const { count } = await tx.payment.updateMany({
    where: { id, status: { in: UNPAID } },
    data: { ...data, status: "PAID" },
  });
  return count === 1;
}

/** What the payment bought, and the organization it belongs to (new for a sign-up). */
export async function recordPaymentPeriod(
  tx: Prisma.TransactionClient,
  id: string,
  data: { organizationId: string; periodStart: Date; periodEnd: Date }
) {
  await tx.payment.update({ where: { id }, data });
}

export async function updateSubscriptionInTx(
  tx: Prisma.TransactionClient,
  organizationId: string,
  data: Prisma.SubscriptionUncheckedUpdateInput
) {
  return tx.subscription.update({ where: { organizationId }, data });
}

export async function isSlugTaken(tx: Prisma.TransactionClient, slug: string) {
  return (await tx.organization.count({ where: { slug } })) > 0;
}

export async function completeOnboardingSessionInTx(tx: Prisma.TransactionClient, id: string) {
  await tx.onboardingSession.update({ where: { id }, data: { status: "COMPLETED" } });
}

/** The onboarding data a sign-up payment creates the dealership from, whatever its status. */
export async function findOnboardingSessionData(id: string) {
  return db.onboardingSession.findUnique({ where: { id }, select: { id: true, data: true, status: true } });
}

/** What a success page needs to know about a payment, and whose it is. */
export async function findPaymentSummary(id: string) {
  return db.payment.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      purpose: true,
      userId: true,
      organizationId: true,
      periodStart: true,
      periodEnd: true,
      organization: { select: { slug: true } },
    },
  });
}

export type PaymentSummary = NonNullable<Awaited<ReturnType<typeof findPaymentSummary>>>;
