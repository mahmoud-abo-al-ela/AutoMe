import type { Prisma, PaymentPurpose } from "@/lib/generated/prisma";
import { runInTransaction } from "@/lib/repositories/transaction";
import * as paymentRepo from "@/lib/repositories/payment";
import type { PaymentForSettlement } from "@/lib/repositories/payment";
import { auditHelpers } from "@/lib/services/audit/audit";
import { sendWelcomeEmail } from "@/lib/services/notification";
import { createOrganizationRecords } from "@/lib/services/onboarding/creation";
import { resolveLogoUrl } from "@/lib/services/onboarding/logo";
import type { OnboardingSessionData } from "@/lib/services/onboarding/session";
import { transactionOutcome, type PaymobTransaction } from "@/lib/services/paymob";
import { logError } from "@/lib/utils/errors";
import { reportSignal } from "@/lib/observability/report";
import {
  periodStartingToday,
  renewalPeriod,
  renewalStage,
  type PeriodBounds,
} from "./periods";
import { paidPeriodState } from "./transitions";
import { emailOwners } from "./notices";

export type SettlementResult =
  | { status: "paid"; paymentId: string; purpose: PaymentPurpose; organizationId: string }
  | { status: "already_paid"; paymentId: string; organizationId: string | null }
  | { status: "failed"; paymentId: string }
  | { status: "pending"; paymentId: string }
  | { status: "ignored"; reason: "unknown_payment" | "child_transaction" }
  | {
      status: "rejected";
      paymentId: string;
      reason: "amount_mismatch" | "currency_mismatch" | "reference_mismatch" | "order_mismatch";
    };

/** A paid payment that cannot be applied: needs a person, so it is thrown and logged. */
export class SettlementError extends Error {
  constructor(
    readonly paymentId: string,
    message: string
  ) {
    super(`Payment ${paymentId}: ${message}`);
    this.name = "SettlementError";
  }
}

type RejectReason = Extract<SettlementResult, { status: "rejected" }>["reason"];

function rejected(paymentId: string, reason: RejectReason, detail: string): SettlementResult {
  const error = new Error(detail);
  void reportSignal({ name: "billing.payment-rejected", level: "error", tags: { "payment.id": paymentId, reason }, groupBy: reason, error });
  logError(error);
  return { status: "rejected", paymentId, reason };
}

const card = (tx: PaymobTransaction) => ({
  method: tx.source_data?.type ?? null,
  maskedPan: tx.source_data?.pan ?? null,
});

export async function settlePayment(
  paymentId: string,
  transaction: PaymobTransaction,
  now: Date = new Date()
): Promise<SettlementResult> {
  // Refunds, voids and captures arrive as child transactions of the payment;
  // a successful refund must never read as a successful payment.
  if (transaction.has_parent_transaction) return { status: "ignored", reason: "child_transaction" };

  const payment = await paymentRepo.findPaymentForSettlement(paymentId);
  if (!payment) return { status: "ignored", reason: "unknown_payment" };

  const reference = transaction.order?.merchant_order_id;
  if (reference && reference !== payment.id) {
    return rejected(paymentId, "reference_mismatch", `Paymob transaction ${transaction.id} names payment ${reference}, delivered for ${paymentId}; not applied`);
  }

  if (!payment.providerOrderId || String(transaction.order?.id) !== payment.providerOrderId) {
    return rejected(
      paymentId,
      "order_mismatch",
      `Paymob transaction ${transaction.id} for order ${transaction.order?.id} names payment ${paymentId}, whose order is ${payment.providerOrderId ?? "unknown"}; not applied, needs review`
    );
  }

  if (payment.status === "PAID") {
    return { status: "already_paid", paymentId, organizationId: payment.organizationId };
  }

  const outcome = transactionOutcome(transaction);
  if (outcome === "pending") return { status: "pending", paymentId };

  if (outcome === "failed") {
    const newlyFailed = await paymentRepo.markPaymentFailed(paymentId, {
      providerTransactionId: String(transaction.id),
      ...card(transaction),
    });
    // An owner paying from a billing email may have closed the tab. A sign-up
    // has no dealership to email yet; its page says so.
    if (newlyFailed && payment.organizationId) {
      await emailOwners(payment.organizationId, {
        kind: "paymentFailed",
        plan: payment.plan,
        amountCents: payment.amountCents,
      });
    }
    return { status: "failed", paymentId };
  }

  // Paid. The signature proves Paymob sent it; these prove it paid for this.
  if (transaction.amount_cents !== payment.amountCents) {
    return rejected(
      paymentId,
      "amount_mismatch",
      `Paymob paid ${transaction.amount_cents} for payment ${paymentId} priced ${payment.amountCents}; not applied, needs review`
    );
  }
  if (transaction.currency !== payment.currency) {
    return rejected(paymentId, "currency_mismatch", `Paymob paid in ${transaction.currency} for ${payment.currency} payment ${paymentId}; not applied`);
  }

  // Outside the transaction: uploads and reads that must not hold it open.
  const signup = payment.purpose === "SIGNUP" ? await prepareSignup(payment) : null;

  const applied = await runInTransaction(async (tx) => {
    const won = await paymentRepo.claimPaymentAsPaid(tx, paymentId, {
      providerTransactionId: String(transaction.id),
      ...card(transaction),
      paidAt: now,
    });
    if (!won) return null;

    const { organizationId, period, slug } = signup
      ? await applySignup(tx, payment, signup, now)
      : payment.purpose === "UPGRADE"
        ? await applyUpgrade(tx, payment, now)
        : await applyRenewal(tx, payment, now);

    await paymentRepo.recordPaymentPeriod(tx, paymentId, {
      organizationId,
      periodStart: period.start,
      periodEnd: period.end,
    });
    return { organizationId, slug, period };
  });

  if (!applied) {
    return { status: "already_paid", paymentId, organizationId: payment.organizationId };
  }

  await afterPaid(payment, applied, signup, now);
  return { status: "paid", paymentId, purpose: payment.purpose, organizationId: applied.organizationId };
}

// ---------------------------------------------------------------- sign-up

interface PreparedSignup {
  sessionId: string;
  data: OnboardingSessionData;
  ownerId: string;
  logoUrl: string | null;
}

async function prepareSignup(payment: PaymentForSettlement): Promise<PreparedSignup> {
  if (!payment.onboardingSessionId || !payment.userId) {
    throw new SettlementError(payment.id, "sign-up payment has no onboarding session or user");
  }
  const session = await paymentRepo.findOnboardingSessionData(payment.onboardingSessionId);
  if (!session) throw new SettlementError(payment.id, "onboarding session is gone");

  // Read whatever its status: the payment, not the session's expiry, decides.
  const data = session.data as unknown as OnboardingSessionData;

  // A logo that fails to upload must not stop a paid dealership from existing.
  const logoUrl = await resolveLogoUrl(data.logo, data.slug).catch((error) => {
    logError(`Logo upload failed for paid sign-up ${payment.id}:`, error);
    return null;
  });

  return { sessionId: session.id, data, ownerId: payment.userId, logoUrl };
}

async function freeSlug(tx: Prisma.TransactionClient, slug: string): Promise<string> {
  if (!(await paymentRepo.isSlugTaken(tx, slug))) return slug;
  for (let n = 2; n <= 20; n += 1) {
    const candidate = `${slug}-${n}`;
    if (!(await paymentRepo.isSlugTaken(tx, candidate))) return candidate;
  }
  return `${slug}-${crypto.randomUUID().slice(0, 6)}`;
}

async function applySignup(
  tx: Prisma.TransactionClient,
  payment: PaymentForSettlement,
  signup: PreparedSignup,
  now: Date
) {
  const { data } = signup;
  const period = periodStartingToday(payment.billingPeriod, now);

  const org = await createOrganizationRecords(
    tx,
    {
      name: data.name,
      slug: await freeSlug(tx, data.slug),
      email: data.email,
      phone: data.phone,
      address: data.address,
      country: data.country,
      region: data.region,
      city: data.city,
      logoUrl: signup.logoUrl,
      workingHours: data.workingHours,
    },
    signup.ownerId,
    {
      planId: payment.planId,
      status: "ACTIVE",
      billingPeriod: payment.billingPeriod,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
    }
  );

  await paymentRepo.completeOnboardingSessionInTx(tx, signup.sessionId);
  return { organizationId: org.id, period, slug: org.slug };
}

// ---------------------------------------------------------------- upgrade

function subscriptionOf(payment: PaymentForSettlement) {
  const subscription = payment.organization?.subscription;
  if (!payment.organizationId || !subscription) {
    throw new SettlementError(payment.id, "the dealership or its subscription is gone");
  }
  return { organizationId: payment.organizationId, subscription };
}

async function applyUpgrade(tx: Prisma.TransactionClient, payment: PaymentForSettlement, now: Date) {
  const { organizationId } = subscriptionOf(payment);
  const period = periodStartingToday(payment.billingPeriod, now);

  await paymentRepo.updateSubscriptionInTx(
    tx,
    organizationId,
    paidPeriodState(payment.planId, payment.billingPeriod, period)
  );
  return { organizationId, period, slug: null };
}

// ---------------------------------------------------------------- renewal

type SettlementSubscription = NonNullable<NonNullable<PaymentForSettlement["organization"]>["subscription"]>;

export function renewalPeriodFor(
  subscription: SettlementSubscription,
  payment: Pick<PaymentForSettlement, "billingPeriod">,
  now: Date
): PeriodBounds {
  const end = subscription.currentPeriodEnd;
  const onPaidPlan = subscription.plan.monthlyPrice > 0 || subscription.plan.yearlyPrice > 0;
  const continues =
    end !== null && onPaidPlan && subscription.status !== "CANCELED" && renewalStage(end, now) !== "expired";
  return continues ? renewalPeriod(end, payment.billingPeriod) : periodStartingToday(payment.billingPeriod, now);
}

async function applyRenewal(tx: Prisma.TransactionClient, payment: PaymentForSettlement, now: Date) {
  const { organizationId } = subscriptionOf(payment);
  // Decide on the subscription as it is now, locked, not as it was read
  // before the transaction: the daily job may have moved it to past-due or
  // the free plan in between, which changes the period this payment buys.
  const subscription = await paymentRepo.lockSubscriptionInTx(tx, organizationId);
  if (!subscription) throw new SettlementError(payment.id, "the dealership's subscription is gone");
  const period = renewalPeriodFor(subscription, payment, now);

  if (period.start.getTime() <= now.getTime()) {
    // The current period is over (the grace, or a fresh start): the renewal is
    // the period in effect, now.
    await paymentRepo.updateSubscriptionInTx(
      tx,
      organizationId,
      paidPeriodState(payment.planId, payment.billingPeriod, period)
    );
  } else {
    // Paid ahead. The current period runs out on its plan; the daily job moves
    // the subscription onto this payment's period when it does. Paying
    // withdraws a cancellation.
    await paymentRepo.updateSubscriptionInTx(tx, organizationId, {
      cancelAtPeriodEnd: false,
      canceledAt: null,
    });
  }
  return { organizationId, period, slug: null };
}

// ---------------------------------------------------------------- after commit

async function afterPaid(
  payment: PaymentForSettlement,
  {
    organizationId,
    slug,
    period,
  }: { organizationId: string; slug: string | null; period: PeriodBounds },
  signup: PreparedSignup | null,
  now: Date
): Promise<void> {
  // Audit and email use their own connections and never fail the payment.
  try {
    if (signup) {
      const org = { id: organizationId, name: signup.data.name, slug: slug ?? signup.data.slug };
      await auditHelpers.logOrgCreated(org, signup.ownerId, payment.user?.email);
    } else {
      const subscription = payment.organization?.subscription;
      await auditHelpers.logSubscriptionChanged(
        {
          id: subscription?.id ?? organizationId,
          organizationId,
          planId: payment.planId,
          status: "ACTIVE",
        },
        subscription?.planId ?? payment.planId,
        payment.purpose === "UPGRADE" ? "SUBSCRIPTION_UPGRADED" : "SUBSCRIPTION_RENEWED",
        payment.userId
      );
    }
  } catch (error) {
    logError(`Audit log failed for payment ${payment.id}:`, error);
  }

  if (signup) {
    const owner = payment.user;
    if (owner?.email) {
      sendWelcomeEmail({
        to: owner.email,
        userName: owner.name || "there",
        dealershipName: signup.data.name,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/org/${slug ?? signup.data.slug}/dashboard`,
      }).catch((error) => logError(error));
    }
  } else {
    // A renewal paid ahead starts later; say when.
    await emailOwners(organizationId, {
      kind: "paymentReceived",
      plan: payment.plan,
      amountCents: payment.amountCents,
      until: period.end,
      startsOn: period.start.getTime() > now.getTime() ? period.start : null,
    });
  }
}
