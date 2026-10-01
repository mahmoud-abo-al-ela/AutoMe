// Billing repository - what the daily renewals job reads and claims
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/prisma";

/**
 * Subscriptions whose period ends by `until` (or already has), on any status
 * the job acts on. The free plan has no period end, so it never appears.
 */
export async function findSubscriptionsEndingBy(until: Date) {
  return db.subscription.findMany({
    where: {
      currentPeriodEnd: { lte: until },
      status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] },
    },
    include: {
      plan: true,
      pendingPlan: true,
      organization: { select: { id: true, deletedAt: true } },
    },
    orderBy: { currentPeriodEnd: "asc" },
  });
}

export type RenewalSubscription = Awaited<ReturnType<typeof findSubscriptionsEndingBy>>[number];

/** Who hears about a dealership's billing: its owners with an address, in its email language. */
export async function findBillingContacts(organizationId: string) {
  return db.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      emailLocale: true,
      memberships: {
        where: { role: "OWNER", user: { email: { not: null } } },
        select: { user: { select: { email: true, name: true } } },
      },
    },
  });
}

export type BillingContacts = NonNullable<Awaited<ReturnType<typeof findBillingContacts>>>;

/**
 * Claim one billing email for one period before sending it. False when an
 * earlier or concurrent run already has; the unique key decides.
 */
export async function claimBillingNotice(organizationId: string, kind: string, periodEnd: Date) {
  try {
    await db.billingNotice.create({ data: { organizationId, kind, periodEnd } });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return false;
    throw error;
  }
}

/** Give a claim back when nobody could be emailed, so the next run tries again. */
export async function releaseBillingNotice(organizationId: string, kind: string, periodEnd: Date) {
  await db.billingNotice.deleteMany({ where: { organizationId, kind, periodEnd } });
}

/** Checkouts started before `before` that Paymob has not reported on. */
export async function findStalePendingPayments(before: Date, take = 50) {
  return db.payment.findMany({
    where: { status: "PENDING", createdAt: { lt: before } },
    orderBy: { createdAt: "asc" },
    take,
    select: { id: true, createdAt: true },
  });
}

/** An abandoned checkout: never paid. Only from PENDING, so a late payment still wins. */
export async function markPaymentExpired(id: string) {
  const { count } = await db.payment.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "EXPIRED" },
  });
  return count === 1;
}
