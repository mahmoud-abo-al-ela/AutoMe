"use client";

import { useTranslations } from "next-intl";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { useFormatters } from "@/hooks/use-formatters";
import { formatPlanAmount } from "@/lib/utils/currency";
import type { PlanRow } from "@/lib/services/super-admin/plans";

/** What the editor reads from a plan's stored features; anything missing reads as off. */
export function planFeatures(plan: PlanRow) {
  const raw = (plan.features && typeof plan.features === "object" && !Array.isArray(plan.features) ? plan.features : {}) as Record<string, unknown>;
  const ai = (raw.aiProcessing ?? {}) as { enabled?: boolean; limit?: number };
  const assistant = (raw.aiAssistant ?? {}) as { enabled?: boolean };
  return {
    aiProcessing: { enabled: ai.enabled === true, limit: typeof ai.limit === "number" ? ai.limit : 0 },
    aiAssistant: assistant.enabled === true,
    chat: raw.chat === true,
    prioritySupport: raw.prioritySupport === true,
  };
}

export const PLAN_ROWS = ["price", "yearly", "trial", "cars", "team", "photos", "activity", "aiListing", "aiAssistant", "chat", "priority"] as const;
export type PlanRowKey = (typeof PLAN_ROWS)[number];

/**
 * A plan's settings as words, the same in the comparison table and on the
 * phone cards: prices in EGP, -1 as "No limit", features as included or not
 * (a boolean, for the table to draw as a tick).
 */
export function usePlanValues() {
  const t = useTranslations("superAdmin.plans");
  const tPlans = useTranslations("plans");
  const fmt = useFormatters();
  const amount = (minor: number) => formatPlanAmount(minor, fmt.locale);
  const limit = (value: number) => (value < 0 ? t("values.noLimit") : fmt.number(value));
  const days = (value: number) => t("values.days", { count: value, value: fmt.number(value) });

  const name = (plan: { type: string; name: string }) => {
    const key = planKeyFor(plan.type);
    return key ? tPlans(`plans.${key}.name`) : plan.name;
  };

  const value = (plan: PlanRow, row: PlanRowKey): string | boolean => {
    const features = planFeatures(plan);
    switch (row) {
      case "price":
        return plan.monthlyPrice > 0 ? t("values.perMonth", { amount: amount(plan.monthlyPrice) }) : t("values.free");
      case "yearly": {
        if (plan.yearlyPrice <= 0) return t("values.none");
        const full = plan.monthlyPrice * 12;
        const saving = full > 0 ? 1 - plan.yearlyPrice / full : 0;
        return saving >= 0.01
          ? t("values.perYearSaving", { amount: amount(plan.yearlyPrice), percent: fmt.number(saving, { style: "percent" }) })
          : t("values.perYear", { amount: amount(plan.yearlyPrice) });
      }
      case "trial":
        return plan.trialDays > 0 ? days(plan.trialDays) : t("values.none");
      case "cars":
        return limit(plan.maxCars);
      case "team":
        return limit(plan.maxMembers);
      case "photos":
        return fmt.number(plan.maxImagesPerCar);
      case "activity":
        return plan.auditLogRetentionDays ? days(plan.auditLogRetentionDays) : t("values.always");
      case "aiListing":
        return features.aiProcessing.enabled ? limit(features.aiProcessing.limit) : t("values.off");
      case "aiAssistant":
        return features.aiAssistant;
      case "chat":
        return features.chat;
      case "priority":
        return features.prioritySupport;
    }
  };

  return { name, value, amount };
}
