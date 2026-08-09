import * as subscriptionRepo from "@/lib/repositories/super-admin/subscription";

/**
 * Subscription service for Super Admin operations
 */

export async function changeOrganizationPlan(orgId: string, planId: string) {
  return subscriptionRepo.updateOrCreateSubscription(orgId, planId);
}
