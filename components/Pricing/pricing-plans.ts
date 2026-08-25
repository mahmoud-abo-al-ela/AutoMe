// Pricing plan data + pure mapping/format helpers.
import { Zap, Shield, Headphones, type LucideIcon } from "lucide-react";
import type { Prisma } from "@/lib/generated/prisma";

/**
 * A feature bullet, as a message key plus its ICU params rather than a
 * sentence. This module is a plain data module with no React in it, so it
 * cannot call a translation hook — and the copy has to survive a language
 * switch without the plan data being refetched.
 */
export type PlanFeature = {
  /** Key under `home.pricing.features`. */
  key: string;
  /** ICU params for `key`, when the bullet interpolates a plan limit. */
  params?: Record<string, number>;
  included: boolean;
};

/** Message keys under `home.pricing.plans`, keyed off the DB plan `type`. */
const PLAN_KEY_BY_TYPE = {
  STARTER: "starter",
  PRO: "pro",
  ENTERPRISE: "enterprise",
} as const;

export type PlanKey = (typeof PLAN_KEY_BY_TYPE)[keyof typeof PLAN_KEY_BY_TYPE];

/** The shape the pricing cards render, whether it came from the DB or the defaults. */
export type UiPlan = {
  /**
   * Supplies the translated name and description. Null for a DB plan whose
   * `type` is unrecognised, in which case the card falls back to `name` —
   * "fall back, never blank".
   */
  planKey: PlanKey | null;
  /** Untranslated DB name, used only when `planKey` is null. */
  name: string;
  /** Cents. null means "contact us" pricing, which renders as "Custom". */
  monthlyPrice: number | null;
  yearlyPrice?: number | null;
  popular: boolean;
  features: PlanFeature[];
  ctaLink: string;
  icon: LucideIcon;
  type?: string | null;
};

function planKeyFor(type?: string | null): PlanKey | null {
  if (!type) return null;
  return PLAN_KEY_BY_TYPE[type as keyof typeof PLAN_KEY_BY_TYPE] ?? null;
}

/** A Plan row as it arrives from the server, before mapDbPlanToUi reshapes it. */
export type DbPlan = {
  type?: string | null;
  name: string;
  monthlyPrice: number | null;
  yearlyPrice?: number | null;
  maxCars?: number | null;
  maxMembers?: number | null;
  maxImagesPerCar?: number | null;
  auditLogRetentionDays?: number | null;
  /** `Plan.features` is a Prisma Json column, so it arrives unstructured. */
  features?: Prisma.JsonValue;
};

/** The flags `mapDbPlanToUi` looks for inside the features JSON. */
type PlanFeatureFlags = {
  chat?: boolean;
  aiProcessing?: { enabled?: boolean };
  prioritySupport?: boolean;
};

/**
 * Read the feature flags out of the Json column. Anything that is not a plain
 * object (null, a string, an array) yields no flags rather than throwing.
 */
function featureFlags(features: DbPlan["features"]): PlanFeatureFlags {
  if (!features || typeof features !== "object" || Array.isArray(features)) {
    return {};
  }
  return features as PlanFeatureFlags;
}

export const defaultPlans: UiPlan[] = [
  {
    planKey: "starter",
    name: "Starter",
    monthlyPrice: 0,
    yearlyPrice: 0,
    popular: false,
    features: [
      { key: "carListings", params: { count: 5 }, included: true },
      { key: "teamMembers", params: { count: 3 }, included: true },
      { key: "imagesPerCar", params: { count: 5 }, included: true },
      { key: "auditLogs", params: { count: 30 }, included: true },
      { key: "liveChat", included: false },
      { key: "aiProcessing", included: false },
      { key: "prioritySupport", included: false },
    ],
    ctaLink: "/onboarding",
    icon: Zap,
    type: "STARTER",
  },
  {
    planKey: "pro",
    name: "Professional",
    monthlyPrice: 4900,
    yearlyPrice: 47040,
    popular: true,
    features: [
      { key: "carListings", params: { count: 50 }, included: true },
      { key: "teamMembers", params: { count: 10 }, included: true },
      { key: "imagesPerCar", params: { count: 10 }, included: true },
      { key: "auditLogs", params: { count: 90 }, included: true },
      { key: "liveChat", included: true },
      { key: "aiProcessing", included: true },
      { key: "prioritySupport", included: true },
    ],
    ctaLink: "/onboarding",
    icon: Shield,
    type: "PRO",
  },
  {
    planKey: "enterprise",
    name: "Enterprise",
    monthlyPrice: null,
    yearlyPrice: null,
    popular: false,
    features: [
      { key: "carListingsUnlimited", included: true },
      { key: "teamMembersUnlimited", included: true },
      { key: "imagesPerCar", params: { count: 20 }, included: true },
      { key: "auditLogsUnlimited", included: true },
      { key: "liveChat", included: true },
      { key: "aiProcessing", included: true },
      { key: "prioritySupport", included: true },
    ],
    ctaLink: "/onboarding",
    icon: Headphones,
    type: "ENTERPRISE",
  },
];

function mapDbPlanToUi(plan: DbPlan): UiPlan {
  const isPro = plan.type === "PRO";
  const isEnterprise = plan.type === "ENTERPRISE";

  let icon = Zap;
  if (isPro) icon = Shield;
  if (isEnterprise) icon = Headphones;

  const ctaLink = "/onboarding";

  const f = featureFlags(plan.features);

  const features: PlanFeature[] = [
    plan.maxCars === -1
      ? { key: "carListingsUnlimited", included: true }
      : { key: "carListings", params: { count: plan.maxCars ?? 0 }, included: true },
    plan.maxMembers === -1
      ? { key: "teamMembersUnlimited", included: true }
      : { key: "teamMembers", params: { count: plan.maxMembers ?? 0 }, included: true },
    {
      key: "imagesPerCar",
      params: { count: plan.maxImagesPerCar || 5 },
      included: true,
    },
    plan.auditLogRetentionDays
      ? { key: "auditLogs", params: { count: plan.auditLogRetentionDays }, included: true }
      : { key: "auditLogsUnlimited", included: true },
    { key: "liveChat", included: !!f.chat },
    { key: "aiProcessing", included: !!f.aiProcessing?.enabled },
    { key: "prioritySupport", included: !!f.prioritySupport },
  ];

  return {
    ...plan,
    planKey: planKeyFor(plan.type),
    popular: isPro,
    features,
    ctaLink,
    icon,
  };
}

/** Resolve the plans to render: DB plans mapped to UI shape, or the defaults. */
export function resolvePlans(dbPlans?: DbPlan[] | null): UiPlan[] {
  return dbPlans && dbPlans.length > 0 ? dbPlans.map(mapDbPlanToUi) : defaultPlans;
}

/** Average yearly savings percentage across paid plans. */
export function calculateSavingsPercentage(plans: UiPlan[]): number {
  const paidPlans = plans.filter(
    (plan): plan is UiPlan & { monthlyPrice: number } =>
      plan.monthlyPrice !== null && plan.monthlyPrice > 0,
  );
  if (paidPlans.length === 0) return 0;

  const totalSavings = paidPlans.reduce((sum, plan) => {
    const monthlyTotal = plan.monthlyPrice * 12;
    const yearlyPrice = plan.yearlyPrice || plan.monthlyPrice * 12 * 0.8;
    const savings = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100;
    return sum + savings;
  }, 0);

  return Math.round(totalSavings / paidPlans.length);
}

/**
 * The rendered price, or null for "contact us" pricing — the caller renders
 * `home.pricing.custom` in that case rather than this module returning the
 * English word "Custom".
 *
 * Plan pricing is deliberately USD and does NOT go through formatCarPrice.
 */
export function formatPlanPrice(plan: UiPlan, billingPeriod: string): string | null {
  if (plan.monthlyPrice === null) return null;
  const price =
    billingPeriod === "monthly"
      ? plan.monthlyPrice
      : plan.yearlyPrice || plan.monthlyPrice * 12 * 0.8;
  return `$${Math.floor(price / 100)}`;
}

/** Message key under `home.pricing` for the billing period, or null to render nothing. */
export function planPeriodKey(
  plan: UiPlan,
  billingPeriod: string,
): "forever" | "perMonth" | "perYear" | null {
  if (plan.monthlyPrice === null) return null;
  if (plan.monthlyPrice === 0) return "forever";
  return billingPeriod === "monthly" ? "perMonth" : "perYear";
}
