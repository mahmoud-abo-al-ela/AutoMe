// Pricing plan data + pure mapping/format helpers.
import { Zap, Shield, Headphones, type LucideIcon } from "lucide-react";

export type PlanFeature = {
  name: string;
  included: boolean;
};

/** The shape the pricing cards render, whether it came from the DB or the defaults. */
export type UiPlan = {
  name: string;
  description: string;
  /** Cents. null means "contact us" pricing, which renders as "Custom". */
  monthlyPrice: number | null;
  yearlyPrice?: number | null;
  popular: boolean;
  features: PlanFeature[];
  cta: string;
  ctaLink: string;
  icon: LucideIcon;
  type?: string | null;
};

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
  features?: {
    chat?: boolean;
    aiProcessing?: { enabled?: boolean };
    prioritySupport?: boolean;
  } | null;
};

export const defaultPlans: UiPlan[] = [
  {
    name: "Starter",
    description: "Perfect for small dealerships",
    monthlyPrice: 0,
    yearlyPrice: 0,
    popular: false,
    features: [
      { name: "5 car listings", included: true },
      { name: "3 team members", included: true },
      { name: "5 images per car", included: true },
      { name: "30 days audit logs", included: true },
      { name: "Live Chat", included: false },
      { name: "AI Processing", included: false },
      { name: "Priority Support", included: false },
    ],
    cta: "Get Started",
    ctaLink: "/onboarding",
    icon: Zap,
    type: "STARTER",
  },
  {
    name: "Professional",
    description: "For growing dealerships",
    monthlyPrice: 4900,
    yearlyPrice: 47040,
    popular: true,
    features: [
      { name: "50 car listings", included: true },
      { name: "10 team members", included: true },
      { name: "10 images per car", included: true },
      { name: "90 days audit logs", included: true },
      { name: "Live Chat", included: true },
      { name: "AI Processing", included: true },
      { name: "Priority Support", included: true },
    ],
    cta: "Get Started",
    ctaLink: "/onboarding",
    icon: Shield,
    type: "PRO",
  },
  {
    name: "Enterprise",
    description: "For large dealership groups",
    monthlyPrice: null,
    yearlyPrice: null,
    popular: false,
    features: [
      { name: "Unlimited car listings", included: true },
      { name: "Unlimited team members", included: true },
      { name: "20 images per car", included: true },
      { name: "Unlimited audit logs", included: true },
      { name: "Live Chat", included: true },
      { name: "AI Processing", included: true },
      { name: "Priority Support", included: true },
    ],
    cta: "Get Started",
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

  let description = "Perfect for small dealerships";
  if (isPro) description = "For growing dealerships";
  if (isEnterprise) description = "For large dealership groups";

  const cta = "Get Started";
  const ctaLink = "/onboarding";

  // Handle features JSON
  const f = plan.features || {};

  const features = [
    {
      name:
        plan.maxCars === -1
          ? "Unlimited car listings"
          : `${plan.maxCars} car listings`,
      included: true,
    },
    {
      name:
        plan.maxMembers === -1
          ? "Unlimited team members"
          : `${plan.maxMembers} team members`,
      included: true,
    },
    {
      name: `${plan.maxImagesPerCar || 5} images per car`,
      included: true,
    },
    {
      name: plan.auditLogRetentionDays
        ? `${plan.auditLogRetentionDays} days audit logs`
        : "Unlimited audit logs",
      included: true,
    },
    { name: "Live Chat", included: !!f.chat },
    { name: "AI Processing", included: !!f.aiProcessing?.enabled },
    { name: "Priority Support", included: !!f.prioritySupport },
  ];

  return { ...plan, description, popular: isPro, features, cta, ctaLink, icon };
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

export function formatPlanPrice(plan: UiPlan, billingPeriod: string): string {
  if (plan.monthlyPrice === null) return "Custom";
  const price =
    billingPeriod === "monthly"
      ? plan.monthlyPrice
      : plan.yearlyPrice || plan.monthlyPrice * 12 * 0.8;
  return `$${Math.floor(price / 100)}`;
}

export function formatPlanPeriod(plan: UiPlan, billingPeriod: string): string {
  if (plan.monthlyPrice === null) return "";
  if (plan.monthlyPrice === 0) return "forever";
  return billingPeriod === "monthly" ? "per month" : "per year";
}
