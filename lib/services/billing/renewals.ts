import * as billingRepo from "@/lib/repositories/billing";
import type { RenewalSubscription } from "@/lib/repositories/billing";
import { auditHelpers } from "@/lib/services/audit/audit";
import { findTransactionByReference } from "@/lib/services/paymob";
import { logError } from "@/lib/utils/errors";
import { isFreePlan } from "@/lib/utils/plan-change";
import { cairoMidnight } from "@/lib/utils/date-only";
import { emailOwners } from "./notices";
import { RENEWAL_NOTICE_DAYS, graceEndsOn, renewalStage } from "./periods";
import { settlePayment } from "./settle";
import { freePlanState, paidPeriodState } from "./transitions";

/**
 * The daily billing job (app/api/cron/billing-renewals). AutoMe keeps the
 * subscription calendar itself, so this is what moves it along:
 *
 *   1. A period that has ended moves onto the renewal paid ahead for it.
 *   2. A week, then three days, before a period or trial ends: the owners get
 *      an email asking them to renew.
 *   3. A period that ended unpaid turns PAST_DUE, with GRACE_DAYS to pay; one
 *      the owner canceled (or set to the free plan) moves to the free plan.
 *   4. After the grace: the free plan.
 *   5. Checkouts Paymob never reported on are asked about, and abandoned
 *      ones expire.
 *
 * Every step is safe to run twice: each acts only on the state it finds, and
 * each email is claimed once per period. A run that stops at its deadline is
 * finished by the next one.
 */

export interface RenewalRunReport {
  rolledOver: number;
  reminded: number;
  pastDue: number;
  downgraded: number;
  paymentsSettled: number;
  paymentsExpired: number;
  failed: number;
  stoppedEarly: boolean;
}

/** A checkout the callback has not reported on after this long is asked about. */
const INQUIRE_AFTER_MS = 15 * 60_000;
/** And one still unpaid after this long is abandoned (its checkout lasts an hour). */
const EXPIRE_AFTER_MS = 2 * 60 * 60_000;

const DAY_MS = 86_400_000;

export async function runBillingRenewals(now: Date, options: { deadline: number }): Promise<RenewalRunReport> {
  const report: RenewalRunReport = {
    rolledOver: 0,
    reminded: 0,
    pastDue: 0,
    downgraded: 0,
    paymentsSettled: 0,
    paymentsExpired: 0,
    failed: 0,
    stoppedEarly: false,
  };

  const freePlan = await billingRepo.findPlanByType("STARTER");
  // The notice window, plus a day of slack for a run that is late.
  const subscriptions = await billingRepo.findSubscriptionsEndingBy(
    new Date(now.getTime() + (RENEWAL_NOTICE_DAYS + 1) * DAY_MS)
  );

  for (const subscription of subscriptions) {
    if (Date.now() > options.deadline) {
      report.stoppedEarly = true;
      return report;
    }
    if (subscription.organization.deletedAt || isFreePlan(subscription.plan)) continue;
    try {
      await renewOne(subscription, freePlan?.id ?? null, now, report);
    } catch (error) {
      logError(`Billing renewal failed for ${subscription.organizationId}`, error);
      report.failed += 1;
    }
  }

  await reconcilePayments(now, options.deadline, report);
  return report;
}

async function renewOne(
  subscription: RenewalSubscription,
  freePlanId: string | null,
  now: Date,
  report: RenewalRunReport
): Promise<void> {
  const end = subscription.currentPeriodEnd;
  if (!end) return;
  const organizationId = subscription.organizationId;
  const ended = end.getTime() <= now.getTime();

  // 1. Paid ahead: nothing to ask for; move onto it once the period ends.
  const ahead = await billingRepo.findPaidRenewalAhead(organizationId, end);
  if (ahead) {
    if (ended && ahead.periodStart && ahead.periodEnd && ahead.periodStart.getTime() <= now.getTime()) {
      await billingRepo.updateSubscription(
        organizationId,
        paidPeriodState(ahead.plan.id, ahead.billingPeriod, { start: ahead.periodStart, end: ahead.periodEnd })
      );
      await logChange(subscription, ahead.plan.id, "SUBSCRIPTION_RENEWED");
      report.rolledOver += 1;
    }
    return;
  }

  const endingToFree = subscription.cancelAtPeriodEnd || (subscription.pendingPlan && isFreePlan(subscription.pendingPlan));

  if (!ended) {
    // 2. The renewal emails. None for a plan set to end.
    if (endingToFree) return;
    const stage = renewalStage(end, now);
    if (stage !== "due" && stage !== "reminder") return;
    const next = subscription.pendingPlan ?? subscription.plan;
    const period = subscription.pendingBillingPeriod ?? subscription.billingPeriod;
    const trial = subscription.status === "TRIALING";
    const kind = stage === "due" ? (trial ? "trialDue" : "renewalDue") : trial ? "trialReminder" : "renewalReminder";
    const delivered = await emailOwners(
      organizationId,
      {
        kind,
        plan: next,
        amountCents: period === "YEARLY" ? next.yearlyPrice : next.monthlyPrice,
        period,
        endsAt: end,
      },
      { kind: stage === "due" ? "renewal_due" : "renewal_reminder", periodEnd: end }
    );
    if (delivered > 0) report.reminded += 1;
    return;
  }

  // 3–4. Ended unpaid.
  if (!freePlanId) throw new Error("The free Starter plan is missing; cannot end a subscription");

  if (endingToFree) {
    await moveToFree(subscription, freePlanId, now, "downgradedCanceled");
    report.downgraded += 1;
    return;
  }

  if (subscription.status !== "PAST_DUE") {
    await billingRepo.updateSubscription(organizationId, { status: "PAST_DUE", pastDueSince: now });
    await emailOwners(
      organizationId,
      { kind: "pastDue", plan: subscription.plan, payBy: cairoMidnight(graceEndsOn(end)) },
      { kind: "past_due", periodEnd: end }
    );
    report.pastDue += 1;
    return;
  }

  if (renewalStage(end, now) === "expired") {
    await moveToFree(subscription, freePlanId, now, "downgradedUnpaid");
    report.downgraded += 1;
  }
}

async function moveToFree(
  subscription: RenewalSubscription,
  freePlanId: string,
  now: Date,
  email: "downgradedCanceled" | "downgradedUnpaid"
): Promise<void> {
  const end = subscription.currentPeriodEnd!;
  await billingRepo.updateSubscription(subscription.organizationId, freePlanState(freePlanId, now));
  await logChange(subscription, freePlanId, "SUBSCRIPTION_DOWNGRADED");
  await emailOwners(
    subscription.organizationId,
    { kind: email, plan: subscription.plan },
    { kind: "downgraded", periodEnd: end }
  );
}

async function logChange(
  subscription: RenewalSubscription,
  planId: string,
  action: "SUBSCRIPTION_RENEWED" | "SUBSCRIPTION_DOWNGRADED"
): Promise<void> {
  // The job acts for nobody in particular: no user on the audit row.
  await auditHelpers
    .logSubscriptionChanged(
      { id: subscription.id, organizationId: subscription.organizationId, planId, status: "ACTIVE" },
      subscription.planId,
      action,
      null
    )
    .catch((error) => logError("Billing audit log failed", error));
}

/**
 * 5. Checkouts still PENDING: the callback may have been lost (a deploy, an
 * outage). Ask Paymob, settle what it reports, and expire what nobody paid.
 */
async function reconcilePayments(now: Date, deadline: number, report: RenewalRunReport): Promise<void> {
  const stale = await billingRepo.findStalePendingPayments(new Date(now.getTime() - INQUIRE_AFTER_MS));
  for (const payment of stale) {
    if (Date.now() > deadline) {
      report.stoppedEarly = true;
      return;
    }
    try {
      const transaction = await findTransactionByReference(payment.id);
      if (transaction) {
        const result = await settlePayment(payment.id, transaction, now);
        if (result.status === "paid") report.paymentsSettled += 1;
      } else if (now.getTime() - payment.createdAt.getTime() > EXPIRE_AFTER_MS) {
        if (await billingRepo.markPaymentExpired(payment.id)) report.paymentsExpired += 1;
      }
    } catch (error) {
      logError(`Could not reconcile payment ${payment.id}`, error);
      report.failed += 1;
    }
  }
}

