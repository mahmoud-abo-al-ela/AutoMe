import { createAuditLog } from "./audit";

/**
 * Subscription audit log helpers
 */

export async function logSubscriptionCreated(subscription, userId, userEmail) {
  return createAuditLog({
    action: "SUBSCRIPTION_CREATED",
    entityType: "SUBSCRIPTION",
    entityId: subscription.id,
    organizationId: subscription.organizationId,
    userId,
    userEmail,
    newValue: { planId: subscription.planId, status: subscription.status },
  });
}

export async function logSubscriptionChanged(
  subscription,
  oldPlanId,
  action,
  userId,
  userEmail
) {
  return createAuditLog({
    action,
    entityType: "SUBSCRIPTION",
    entityId: subscription.id,
    organizationId: subscription.organizationId,
    userId,
    userEmail,
    oldValue: { planId: oldPlanId },
    newValue: { planId: subscription.planId, status: subscription.status },
  });
}
