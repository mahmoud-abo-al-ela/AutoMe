// Billing service - Business logic layer for plans, subscriptions, and billing
import type { AuditAction, PlanType, Prisma } from "@/lib/generated/prisma";
import * as billingRepo from "@/lib/repositories/billing";

/**
 * Get all active plans for display (onboarding, billing, etc.)
 * @returns {Promise<Array>} List of active plans ordered by price
 */
export async function getActivePlans() {
  return billingRepo.findActivePlans();
}

/**
 * Get a specific plan by ID
 * @param {string} planId - The plan ID
 * @returns {Promise<Object|null>} The plan or null if not found
 */
export async function getPlanById(planId: string) {
  return billingRepo.findPlanById(planId);
}

/**
 * Get a specific plan by type
 * @param {string} type - The plan type (e.g., 'STARTER', 'PRO', 'ENTERPRISE')
 * @returns {Promise<Object|null>} The plan or null if not found
 */
export async function getPlanByType(type: PlanType) {
  return billingRepo.findPlanByType(type);
}

/**
 * Get active subscription for an organization
 * @param {string} organizationId - The organization ID
 * @returns {Promise<Object|null>} The active subscription with plan details
 */
export async function getActiveSubscription(organizationId: string) {
  return billingRepo.findActiveSubscription(organizationId);
}

/**
 * Get subscription by organization ID
 * @param {string} organizationId - The organization ID
 * @returns {Promise<Object|null>} The subscription with plan details
 */
export async function getSubscription(organizationId: string) {
  return billingRepo.findSubscriptionByOrgId(organizationId);
}

/**
 * Get usage statistics for an organization
 * @param {string} organizationId - The organization ID
 * @returns {Promise<Object>} Usage stats including car count, member count, etc.
 */
export async function getUsageStats(organizationId: string) {
  return billingRepo.getUsageCounts(organizationId);
}

/**
 * Get all billing page data for an organization
 * @param {string} organizationId - The organization ID
 * @returns {Promise<Object>} Complete billing data including subscription, plans, and usage
 */
export async function getBillingData(organizationId: string) {
  const [subscription, plans, usage] = await Promise.all([
    getActiveSubscription(organizationId),
    getActivePlans(),
    getUsageStats(organizationId),
  ]);

  return {
    subscription,
    plans,
    usage,
  };
}

/**
 * Get billing history for an organization from audit logs
 * @param {string} organizationId - The organization ID
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<Array>} List of billing-related audit logs
 */
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
