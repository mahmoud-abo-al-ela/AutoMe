import { createAuditLog } from "./audit";
import { AuditAction } from "@/lib/generated/prisma";

/**
 * Subscription audit log helpers
 */

interface AuditSubscription {
  id: string;
  organizationId: string;
  planId?: string;
  status?: string;
}

export async function logSubscriptionCreated(subscription: AuditSubscription, userId?: string | null, userEmail?: string | null) {
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
  subscription: AuditSubscription,
  oldPlanId: string,
  action: AuditAction,
  userId?: string | null,
  userEmail?: string | null
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
