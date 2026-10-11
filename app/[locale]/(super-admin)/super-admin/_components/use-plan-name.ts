import { useTranslations } from "next-intl";
import { planKeyFor } from "@/lib/constants/plans";

/** A plan's name in the reader's language; the stored name for a type it does not know. */
export function usePlanName() {
  const tPlans = useTranslations("plans");
  return (plan: { type: string; name: string }) => {
    const key = planKeyFor(plan.type);
    return key ? tPlans(`plans.${key}.name`) : plan.name;
  };
}
