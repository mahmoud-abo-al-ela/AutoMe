// Pricing plan data + pure mapping/format helpers.
import { Zap, Shield, Headphones, type LucideIcon } from "lucide-react";
import type { Prisma } from "@/lib/generated/prisma";
import type { Locale } from "@/i18n/routing";
import { formatNumber } from "@/lib/utils/number";

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

/** Message key under `plans.plans` for a DB plan `type`, or null if unrecognised. */
export function planKeyFor(type?: string | null): PlanKey | null {
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
  aiProcessing?: { enabled?: boolean; limit?: number };
  prioritySupport?: boolean;
};

/**
 * The AI bullet states the monthly allowance rather than a bare yes/no, since
 * the plans that have AI differ only in how much. Enabled with no limit reads
 * as not included, because withUsageLimit enforces a missing limit as 0.
 */
function aiProcessingFeature(ai: PlanFeatureFlags["aiProcessing"]): PlanFeature {
  const limit = ai?.limit ?? 0;
  if (!ai?.enabled || limit === 0) return { key: "aiProcessing", included: false };
  if (limit === -1) return { key: "aiProcessingUnlimited", included: true };
  return { key: "aiProcessingMonthly", params: { count: limit }, included: true };
}

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
      { key: "aiProcessingMonthly", params: { count: 5 }, included: true },
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
      { key: "aiProcessingMonthly", params: { count: 100 }, included: true },
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
      { key: "aiProcessingUnlimited", included: true },
      { key: "prioritySupport", included: true },
    ],
    ctaLink: "/onboarding",
    icon: Headphones,
    type: "ENTERPRISE",
  },
];

/**
 * The bullets a plan's limits and flags produce, as message keys.
 *
 * Exported because the onboarding wizard lists the same plans and used to
 * derive the same bullets itself — from a camelCase-to-Title-Case split of
 * whatever keys the Json column happened to hold, which produces English by
 * construction and so could not be translated at all.
 */
export function planFeatureKeys(plan: DbPlan): PlanFeature[] {
  const f = featureFlags(plan.features);

  return [
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
    aiProcessingFeature(f.aiProcessing),
    { key: "prioritySupport", included: !!f.prioritySupport },
  ];
}

function mapDbPlanToUi(plan: DbPlan): UiPlan {
  const isPro = plan.type === "PRO";
  const isEnterprise = plan.type === "ENTERPRISE";

  let icon = Zap;
  if (isPro) icon = Shield;
  if (isEnterprise) icon = Headphones;

  return {
    ...plan,
    planKey: planKeyFor(plan.type),
    popular: isPro,
    features: planFeatureKeys(plan),
    ctaLink: "/onboarding",
    icon,
  };
}

/** Resolve the plans to render: DB plans mapped to UI shape, or the defaults. */
export function resolvePlans(dbPlans?: DbPlan[] | null): UiPlan[] {
  return dbPlans && dbPlans.length > 0 ? dbPlans.map(mapDbPlanToUi) : defaultPlans;
}

/**
 * The two price columns every pricing surface reads. Narrower than `UiPlan` so
 * the onboarding wizard, whose plans come straight from Prisma, can share the
 * helpers below without first being reshaped into a card model.
 */
export type PlanPricing = {
  monthlyPrice: number | null;
  yearlyPrice?: number | null;
};

/** Average yearly savings percentage across paid plans. */
export function calculateSavingsPercentage(plans: PlanPricing[]): number {
  const paidPlans = plans.filter(
    (plan): plan is PlanPricing & { monthlyPrice: number } =>
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
 * `plans.custom` in that case rather than this module returning the English
 * word "Custom".
 *
 * Plan pricing is deliberately USD and does NOT go through formatCarPrice:
 * Stripe charges these in dollars (lib/services/stripe/plan.ts), so showing
 * them as EGP would misstate what the customer is billed.
 *
 * The digits, however, are the reader's — `formatNumber` routes them through
 * `intlLocale`, so an Arabic page reads ٤٩ like every other number on it
 * rather than being the one place that stays Western.
 */
export function formatPlanPrice(
  plan: PlanPricing,
  billingPeriod: string,
  locale: Locale = "en",
): string | null {
  if (plan.monthlyPrice === null) return null;
  const price =
    billingPeriod === "monthly"
      ? plan.monthlyPrice
      : plan.yearlyPrice || plan.monthlyPrice * 12 * 0.8;
  return `$${formatNumber(Math.floor(price / 100), locale)}`;
}

/** Message key under `plans` for the billing period, or null to render nothing. */
export function planPeriodKey(
  plan: PlanPricing,
  billingPeriod: string,
): "forever" | "perMonth" | "perYear" | null {
  if (plan.monthlyPrice === null) return null;
  if (plan.monthlyPrice === 0) return "forever";
  return billingPeriod === "monthly" ? "perMonth" : "perYear";
}
