// Pure display helpers + config shared by the plan-comparison components.
import { Sparkles, TrendingUp, Crown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Plan, PlanType } from "@/lib/generated/prisma";

export const PLAN_CONFIG: Record<
  PlanType,
  { icon: LucideIcon; color: string; border: string; badge?: string }
> = {
  STARTER: {
    icon: Sparkles,
    color: "text-gray-600",
    border: "border-gray-200",
  },
  PRO: {
    icon: TrendingUp,
    color: "text-blue-600",
    border: "border-blue-500",
    badge: "Most Popular",
  },
  ENTERPRISE: {
    icon: Crown,
    color: "text-purple-600",
    border: "border-purple-500",
  },
};

/**
 * Plan prices, in minor units.
 *
 * Deliberately USD, unlike car prices: Stripe charges subscriptions in USD
 * (lib/services/stripe/plan.ts), so this matches what the customer is actually
 * billed. Whether plan pricing should move to EGP is a business decision that
 * has to change Stripe and this together — see lib/utils/currency.ts.
 */
export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price / 100);
}

export function formatFeatureName(key: string) {
  const nameMap: Record<string, string> = {
    aiProcessing: "AI Processing",
    chat: "Live Chat",
    prioritySupport: "Priority Support",
  };
  return (
    nameMap[key] ||
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str: string) => str.toUpperCase())
      .trim()
  );
}

/** One row of a plan's feature list. */
export type PlanFeature = { name: string; included: boolean };

export function getFeatures(plan: Plan): PlanFeature[] {
  // Plan.features is a Json column; the shape is written by the super-admin
  // plan form, so it is read defensively rather than asserted here.
  const f = (plan.features ?? {}) as Record<string, unknown>;
  const features: PlanFeature[] = [];

  features.push({
    name:
      plan.maxCars === -1
        ? "Unlimited car listings"
        : `${plan.maxCars} car listings`,
    included: true,
  });
  features.push({
    name:
      plan.maxMembers === -1
        ? "Unlimited team members"
        : `${plan.maxMembers} team members`,
    included: true,
  });
  features.push({
    name: `${plan.maxImagesPerCar} images per car`,
    included: true,
  });
  features.push({
    name:
      plan.auditLogRetentionDays === null
        ? "Unlimited audit logs"
        : `${plan.auditLogRetentionDays} days audit logs`,
    included: true,
  });

  Object.entries(f).forEach(([key, value]) => {
    if (key === "analytics" || key === "whiteLabel" || key === "webhooks")
      return;
    if (typeof value === "object" && value !== null && "enabled" in value) {
      features.push({
        name: formatFeatureName(key),
        included: !!(value as { enabled?: unknown }).enabled,
      });
    } else if (typeof value === "boolean") {
      features.push({ name: formatFeatureName(key), included: value });
    }
  });

  return features;
}

/**
 * Collect all unique feature names across all plans for the comparison table
 */
export function getAllFeatureNames(plans: Plan[]): string[] {
  const featureSet = new Set<string>();
  plans.forEach((plan) => {
    getFeatures(plan).forEach((f) => featureSet.add(f.name));
  });
  return Array.from(featureSet);
}

/**
 * Build a lookup: featureName -> boolean for a given plan
 */
export function getFeatureLookup(plan: Plan): Record<string, boolean> {
  const lookup: Record<string, boolean> = {};
  getFeatures(plan).forEach((f) => {
    lookup[f.name] = f.included;
  });
  return lookup;
}
