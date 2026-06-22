import * as teamRepo from "@/lib/repositories/team";
import * as billingRepo from "@/lib/repositories/billing/queries";
import { auditHelpers } from "@/lib/services/audit/audit";

const PLAN_LIMITS = {
  STARTER: 3,
  PRO: 10,
  ENTERPRISE: -1,
};

/**
 * Get team members for an organization
 */
export async function getTeamMembersService(organizationId) {
  return teamRepo.findManyMembers(organizationId);
}

/**
 * Get subscription details for an organization
 */
export async function getSubscriptionDetailsService(organizationId) {
  return billingRepo.findActiveSubscription(organizationId);
}


