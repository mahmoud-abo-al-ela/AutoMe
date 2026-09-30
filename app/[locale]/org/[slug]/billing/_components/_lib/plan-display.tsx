// Presentation config for the plan-comparison components.
//
// The feature bullets used to be built here, a second time: this module
// derived names like "5 car listings" and "AI Processing" from the plan's
// columns and a camelCase-to-Title-Case split of the Json column's keys. That
// produces English by construction, and it produced *different* English from
// the marketing pricing cards, which had already moved to message keys.
//
// So the bullets come from `planFeatureKeys` now — one source for the pricing
// page, the onboarding wizard and this page — and what is left here is the
// icon, the colours and the "most popular" flag, which are not copy.
import { Sparkles, TrendingUp, Crown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PlanType } from "@/lib/generated/prisma";
import { planFeatureKeys, type DbPlan, type PlanFeature } from "@/components/Pricing/pricing-plans";

export const PLAN_CONFIG: Record<
  PlanType,
  { icon: LucideIcon; color: string; border: string; badgeKey?: "mostPopular" }
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
    badgeKey: "mostPopular",
  },
  ENTERPRISE: {
    icon: Crown,
    color: "text-purple-600",
    border: "border-purple-500",
  },
};

/**
 * Every feature key any of these plans offers, in the order the first plan
 * lists them — the row order of the comparison table.
 *
 * Keys, not names: the rows are identity, and identity cannot be a translated
 * string. Keying the table by the rendered name meant the row set changed with
 * the reader's language.
 */
export function getAllFeatureKeys(plans: DbPlan[]): PlanFeature[] {
  const seen = new Map<string, PlanFeature>();

  for (const plan of plans) {
    for (const feature of planFeatureKeys(plan)) {
      if (!seen.has(feature.key)) seen.set(feature.key, feature);
    }
  }

  return Array.from(seen.values());
}

/** featureKey → included, for one plan. */
export function getFeatureLookup(plan: DbPlan): Record<string, boolean> {
  const lookup: Record<string, boolean> = {};
  for (const feature of planFeatureKeys(plan)) {
    lookup[feature.key] = feature.included;
  }
  return lookup;
}
