// Pure display helpers + config shared by the plan-comparison components.
import { Sparkles, TrendingUp, Crown } from "lucide-react";

export const PLAN_CONFIG = {
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

export function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price / 100);
}

export function formatFeatureName(key) {
  const nameMap = {
    aiProcessing: "AI Processing",
    chat: "Live Chat",
    prioritySupport: "Priority Support",
  };
  return (
    nameMap[key] ||
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  );
}

export function getFeatures(plan) {
  const f = plan.features || {};
  const features = [];

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
        included: !!value.enabled,
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
export function getAllFeatureNames(plans) {
  const featureSet = new Set();
  plans.forEach((plan) => {
    getFeatures(plan).forEach((f) => featureSet.add(f.name));
  });
  return Array.from(featureSet);
}

/**
 * Build a lookup: featureName -> boolean for a given plan
 */
export function getFeatureLookup(plan) {
  const lookup = {};
  getFeatures(plan).forEach((f) => {
    lookup[f.name] = f.included;
  });
  return lookup;
}
