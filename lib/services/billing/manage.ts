import type { BillingPeriod } from "@/lib/generated/prisma";
import type { Locale } from "@/i18n/routing";
import * as billingRepo from "@/lib/repositories/billing";
import { auditHelpers } from "@/lib/services/audit/audit";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/utils/errors";
import { isFreePlan, planChange } from "@/lib/utils/plan-change";
import { startCheckout } from "./checkout";
import { renewalStage } from "./periods";
import { freePlanState } from "./transitions";

/**
 * What a dealership owner can do to its subscription from the billing page.
 * Callers own auth, the owner check and rate limiting (actions/billing.ts).
 *
 * Nothing here charges anyone directly: a payment is a checkout (checkout.ts)
 * that takes effect when Paymob confirms it (settle.ts). What changes here at
 * once is only what costs nothing: a scheduled downgrade or cancellation, and
 * changes during a trial or after a lapse.
 */

export interface BillingOrganization {
  id: string;
  slug: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface BillingActor {
  id: string;
  name?: string | null;
  email?: string | null;
}

async function subscriptionOf(organizationId: string) {
  const subscription = await billingRepo.findSubscriptionByOrgId(organizationId);
  if (!subscription) throw new NotFoundError("Subscription");
  return subscription;
}

type Subscription = Awaited<ReturnType<typeof subscriptionOf>>;

/**
 * Once the next period is paid for, the plan is settled until it starts: an
 * upgrade, a downgrade or a cancellation would leave that payment for a period
 * that no longer exists. Support refunds it if the owner really wants out.
 */
async function assertNothingPaidAhead(subscription: Subscription): Promise<void> {
  if (!subscription.currentPeriodEnd) return;
  const ahead = await billingRepo.findPaidRenewalAhead(subscription.organizationId, subscription.currentPeriodEnd);
  if (ahead) {
    throw new ConflictError("The next period is already paid", { key: "errors.billing.renewalAlreadyPaid" });
  }
}

async function activePlan(planId: string) {
  const plan = await billingRepo.findPlanById(planId);
  if (!plan || !plan.isActive) throw new NotFoundError("Plan");
  return plan;
}

export type PlanChangeResult =
  | { type: "redirect"; url: string }
  | { type: "scheduled"; effectiveAt: Date | null }
  | { type: "updated" };

export async function changePlan({
  organization,
  actor,
  planId,
  billingPeriod,
  locale,
}: {
  organization: BillingOrganization;
  actor: BillingActor;
  planId: string;
  billingPeriod: BillingPeriod;
  locale: Locale;
}): Promise<PlanChangeResult> {
  const subscription = await subscriptionOf(organization.id);
  const target = await activePlan(planId);
  const change = planChange(subscription, target, billingPeriod);

  if (change === "none") {
    throw new ValidationError("Already on this plan", "planId", { key: "errors.billing.alreadyOnPlan" });
  }
  await assertNothingPaidAhead(subscription);

  if (change === "pay") {
    const checkout = await startCheckout({
      purpose: "UPGRADE",
      organizationId: organization.id,
      organizationSlug: organization.slug,
      planId: target.id,
      billingPeriod,
      locale,
      payer: { userId: actor.id, name: actor.name, email: actor.email },
      dealership: { name: organization.name, email: organization.email, phone: organization.phone },
    });
    return { type: "redirect", url: checkout.url };
  }

  if (change === "schedule") {
    const toFree = isFreePlan(target);
    await billingRepo.updateSubscription(organization.id, {
      pendingPlanId: target.id === subscription.planId ? null : target.id,
      pendingBillingPeriod: toFree ? null : billingPeriod,
      cancelAtPeriodEnd: false,
      canceledAt: null,
    });
    return { type: "scheduled", effectiveAt: subscription.currentPeriodEnd };
  }

  // "apply": nothing paid is cut short.
  if (isFreePlan(target)) {
    await billingRepo.updateSubscription(organization.id, freePlanState(target.id, new Date()));
    await auditHelpers.logSubscriptionChanged(
      { id: subscription.id, organizationId: organization.id, planId: target.id, status: "ACTIVE" },
      subscription.planId,
      "SUBSCRIPTION_DOWNGRADED",
      actor.id,
      actor.email
    );
  } else {
    // A trial switching between monthly and yearly.
    await billingRepo.updateSubscription(organization.id, { billingPeriod, pendingBillingPeriod: null });
  }
  return { type: "updated" };
}

/**
 * Pay for the next period now: during a trial, from a week before the period
 * ends, or in the grace after it. It is for the plan and period the
 * subscription will have next (a scheduled change included).
 */
export async function payRenewal({
  organization,
  actor,
  locale,
  now = new Date(),
}: {
  organization: BillingOrganization;
  actor: BillingActor;
  locale: Locale;
  now?: Date;
}): Promise<{ url: string }> {
  const subscription = await subscriptionOf(organization.id);
  const nextPlan = subscription.pendingPlan ?? subscription.plan;
  const end = subscription.currentPeriodEnd;

  const stage = end ? renewalStage(end, now) : null;
  const due =
    subscription.status === "TRIALING" || stage === "due" || stage === "reminder" || stage === "grace";
  if (!due || isFreePlan(subscription.plan) || isFreePlan(nextPlan)) {
    throw new ValidationError("No renewal is due", null, { key: "errors.billing.renewalNotDue" });
  }
  await assertNothingPaidAhead(subscription);

  const checkout = await startCheckout({
    purpose: "RENEWAL",
    organizationId: organization.id,
    organizationSlug: organization.slug,
    planId: nextPlan.id,
    billingPeriod: subscription.pendingBillingPeriod ?? subscription.billingPeriod,
    locale,
    payer: { userId: actor.id, name: actor.name, email: actor.email },
    dealership: { name: organization.name, email: organization.email, phone: organization.phone },
  });
  return { url: checkout.url };
}

/**
 * Stop renewing. The plan runs to the end of what is paid (or the trial),
 * then the dealership moves to the free plan. Past due, nothing is paid, so
 * it moves now.
 */
export async function cancelPlan({
  organization,
  actor,
  now = new Date(),
}: {
  organization: BillingOrganization;
  actor: BillingActor;
  now?: Date;
}): Promise<PlanChangeResult> {
  const subscription = await subscriptionOf(organization.id);
  if (isFreePlan(subscription.plan)) {
    throw new ValidationError("Already on the free plan", null, { key: "errors.billing.alreadyFree" });
  }
  await assertNothingPaidAhead(subscription);

  if (subscription.status === "PAST_DUE") {
    const free = await billingRepo.findPlanByType("STARTER");
    if (!free) throw new NotFoundError("Plan");
    return changePlan({
      organization,
      actor,
      planId: free.id,
      billingPeriod: "MONTHLY",
      // Applies at once (nothing to pay), so no checkout page is involved.
      locale: "en",
    });
  }

  await billingRepo.updateSubscription(organization.id, {
    cancelAtPeriodEnd: true,
    canceledAt: now,
    pendingPlanId: null,
    pendingBillingPeriod: null,
  });
  await auditHelpers.logSubscriptionChanged(
    { id: subscription.id, organizationId: organization.id, planId: subscription.planId, status: subscription.status },
    subscription.planId,
    "SUBSCRIPTION_CANCELED",
    actor.id,
    actor.email
  );
  return { type: "scheduled", effectiveAt: subscription.currentPeriodEnd };
}

/** Undo a scheduled cancellation or plan change: keep things as they are. */
export async function keepCurrentPlan({ organization }: { organization: BillingOrganization }) {
  await subscriptionOf(organization.id);
  await billingRepo.updateSubscription(organization.id, {
    cancelAtPeriodEnd: false,
    canceledAt: null,
    pendingPlanId: null,
    pendingBillingPeriod: null,
  });
}
