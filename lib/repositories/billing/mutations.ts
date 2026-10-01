// Billing repository - subscription writes and payment reads for the billing page
import type { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

export async function updateSubscription(
  organizationId: string,
  data: Prisma.SubscriptionUncheckedUpdateInput
) {
  return db.subscription.update({ where: { organizationId }, data });
}

/**
 * A renewal already paid for the period after `currentPeriodEnd`: the
 * subscription moves onto it when the current period ends.
 */
export async function findPaidRenewalAhead(organizationId: string, currentPeriodEnd: Date) {
  return db.payment.findFirst({
    where: {
      organizationId,
      purpose: "RENEWAL",
      status: "PAID",
      periodStart: { gte: currentPeriodEnd },
    },
    orderBy: { periodStart: "asc" },
    select: {
      id: true,
      periodStart: true,
      periodEnd: true,
      billingPeriod: true,
      plan: { select: { id: true, name: true, type: true } },
    },
  });
}

/** The payments a dealership sees in its history: paid, failed and refunded. */
export async function findPaymentHistory(organizationId: string, take = 24) {
  return db.payment.findMany({
    where: { organizationId, status: { in: ["PAID", "FAILED", "REFUNDED"] } },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      purpose: true,
      status: true,
      amountCents: true,
      currency: true,
      billingPeriod: true,
      method: true,
      maskedPan: true,
      periodStart: true,
      periodEnd: true,
      paidAt: true,
      createdAt: true,
      plan: { select: { name: true, type: true } },
    },
  });
}
