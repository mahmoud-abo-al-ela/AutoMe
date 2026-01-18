"use server";

import { checkUser } from "@/lib/checkUser";
import { getOrganizationById, getUserMembership } from "@/lib/getOrganization";
import * as billingService from "@/lib/services/billing";

// ============ PLAN ACTIONS ============

/**
 * Get all active plans
 */
export async function getActivePlans() {
  return billingService.getActivePlans();
}

/**
 * Get a plan by ID
 */
export async function getPlanById(planId) {
  return billingService.getPlanById(planId);
}

// ============ BILLING DATA ACTIONS ============

/**
 * Get billing data for an organization
 */
export async function getBillingData(organizationId) {
  const user = await checkUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new Error("Organization not found");
  }

  return billingService.getBillingData(organization.id);
}

/**
 * Get billing history for an organization
 */
export async function getBillingHistory(organizationId) {
  const user = await checkUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new Error("Organization not found");
  }

  const membership = await getUserMembership(user.id, organization.id);
  if (!membership || membership.role !== "OWNER") {
    throw new Error("Only owners can view billing history");
  }

  const history = await billingService.getBillingHistory(organization.id);

  return { history };
}

/**
 * Get current subscription for an organization
 */
export async function getCurrentSubscription(organizationId) {
  const user = await checkUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new Error("Organization not found");
  }

  return billingService.getActiveSubscription(organization.id);
}

/**
 * Get usage stats for an organization
 */
export async function getUsageStats(organizationId) {
  const user = await checkUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const organization = await getOrganizationById(organizationId);
  if (!organization) {
    throw new Error("Organization not found");
  }

  return billingService.getUsageStats(organization.id);
}
