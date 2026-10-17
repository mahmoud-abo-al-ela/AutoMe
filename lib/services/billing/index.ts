// Billing service - Business logic layer for plans, subscriptions, and billing
import type { AuditAction, PlanType, Prisma } from "@/lib/generated/prisma";
import * as billingRepo from "@/lib/repositories/billing";
import { findOwnerContact } from "@/lib/repositories/team";
import { cairoMidnight } from "@/lib/utils/date-only";
import { isFreePlan } from "@/lib/utils/plan-change";
import { daysLeft, graceEndsOn, renewalStage } from "./periods";

/**
 * Get all active plans for display (onboarding, billing, etc.)
 * @returns {Promise<Array>} List of active plans ordered by price
 */
export async function getActivePlans() {
  return billingRepo.findActivePlans();
}

export async function getPlanById(planId: string) {
  return billingRepo.findPlanById(planId);
}

export async function getPlanByType(type: PlanType) {
  return billingRepo.findPlanByType(type);
}

export async function getActiveSubscription(organizationId: string) {
  return billingRepo.findActiveSubscription(organizationId);
}

export async function getSubscription(organizationId: string) {
  return billingRepo.findSubscriptionByOrgId(organizationId);
}

export async function getUsageStats(organizationId: string) {
  return billingRepo.getUsageCounts(organizationId);
}

export async function getBillingData(organizationId: string, now: Date = new Date()) {
  const [subscription, plans, usage, payments] = await Promise.all([
    getActiveSubscription(organizationId),
    getActivePlans(),
    getUsageStats(organizationId),
    billingRepo.findPaymentHistory(organizationId),
  ]);

  const periodEnd = subscription?.currentPeriodEnd ?? null;
  const paidAhead = periodEnd ? await billingRepo.findPaidRenewalAhead(organizationId, periodEnd) : null;

  // The renewal as of now, in Cairo days (periods.ts); null on the free plan.
  const renewal =
    subscription && periodEnd && !isFreePlan(subscription.plan)
      ? {
          stage: renewalStage(periodEnd, now),
          daysLeft: daysLeft(periodEnd, now),
          /** The day the dealership moves to the free plan if still unpaid. */
          graceEndsAt: cairoMidnight(graceEndsOn(periodEnd)),
          plan: subscription.pendingPlan ?? subscription.plan,
          billingPeriod: subscription.pendingBillingPeriod ?? subscription.billingPeriod,
        }
      : null;

  return {
    subscription,
    plans,
    usage,
    payments,
    paidAhead,
    renewal,
    lastPayment: payments.find((payment) => payment.status === "PAID") ?? null,
  };
}

/**
 * Who a member who is not the owner should contact about billing: the
 * owner's name and email, or null when the dealership has no owner.
 */
export async function getBillingContact(organizationId: string) {
  return findOwnerContact(organizationId);
}

export async function getBillingHistory(organizationId: string, limit = 10) {
  const billingEvents = await billingRepo.findBillingEvents(organizationId, limit);

  return billingEvents.map((event) => ({
    id: event.id,
    date: event.createdAt,
    action: event.action,
    description: formatBillingAction(event.action, event.newValue),
    actor: event.user?.name || event.userEmail || "System",
    metadata: event.metadata,
    oldValue: event.oldValue,
    newValue: event.newValue,
  }));
}

/**
 * Format billing action for display
 */
function formatBillingAction(
  action: AuditAction,
  newValue: Prisma.JsonValue
): string {
  // newValue is free-form JSON on the audit row; read the two shapes the
  // subscription loggers write, falling back to a generic label.
  const record =
    newValue && typeof newValue === "object" && !Array.isArray(newValue)
      ? (newValue as Record<string, unknown>)
      : {};
  const nestedPlan =
    record.plan && typeof record.plan === "object" && !Array.isArray(record.plan)
      ? (record.plan as Record<string, unknown>)
      : {};
  const planName = record.planName || nestedPlan.name || "Plan";

  switch (action) {
    case "SUBSCRIPTION_CREATED":
      return `Subscribed to ${planName}`;
    case "SUBSCRIPTION_UPGRADED":
      return `Upgraded to ${planName}`;
    case "SUBSCRIPTION_DOWNGRADED":
      return `Downgraded to ${planName}`;
    case "SUBSCRIPTION_CANCELED":
      return `Subscription canceled`;
    case "SUBSCRIPTION_RENEWED":
      return `Subscription renewed for ${planName}`;
    default:
      return action.replace(/_/g, " ").toLowerCase();
  }
}
