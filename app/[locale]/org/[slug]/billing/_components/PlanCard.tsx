"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { PLAN_CONFIG } from "./_lib/plan-display";
import {
  planFeatureKeys,
  planKeyFor,
  formatPlanPrice,
} from "@/components/Pricing/pricing-plans";
import type { PlanType } from "@/lib/generated/prisma";
import type { BillingPlan } from "./_lib/billing-types";

export default function PlanCard({
  plan,
  config,
  isCurrent,
  isPro,
  displayPrice,
  savings,
  billingCycle,
  isOwner,
  onSelect,
}: {
  plan: BillingPlan;
  config: (typeof PLAN_CONFIG)[PlanType];
  isCurrent: boolean;
  isPro: boolean;
  /** Minor units, for the selected billing cycle. */
  displayPrice: number;
  /** Percent saved by paying yearly; 0 when there is nothing to save. */
  savings: number;
  billingCycle: "monthly" | "yearly";
  isOwner: boolean;
  onSelect: (plan: BillingPlan) => void;
}) {
  const t = useTranslations("org.billing.plans");
  const tPlans = useTranslations("plans");
  const { number, locale } = useFormatters();
  const Icon = config.icon;

  // The plan name and its feature bullets come from the same source the
  // marketing pricing cards and the onboarding wizard read. A DB plan with an
  // unrecognised `type` has no key, so it falls back to the untranslated name
  // rather than rendering blank.
  const planKey = planKeyFor(plan.type);
  const name = planKey ? tPlans(`plans.${planKey}.name`) : plan.name;
  const features = planFeatureKeys(plan);
  const price = formatPlanPrice(plan, billingCycle, locale);

  // The limit a bullet quotes is formatted here rather than left to ICU,
  // which would use the bare `ar` tag and render Western digits.
  const featureParams = (feature: (typeof features)[number]) =>
    feature.params ? { value: number(feature.params.count) } : undefined;

  return (
    <Card
      className={`relative transition-all duration-300 hover:shadow-lg mt-6 min-w-[280px] snap-center ${isCurrent ? "ring-2 ring-green-600 shadow-md" : config.border
        } ${isPro && !isCurrent ? "md:scale-105 md:z-10" : ""}`}
    >
      {config.badgeKey && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <Badge className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1">
            {tPlans(config.badgeKey)}
          </Badge>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
          <Badge className="bg-green-600 hover:bg-green-700 text-white px-3 py-1">
            {t("currentBadge")}
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-2 rounded-lg bg-background/80 ${config.color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-xl">{name}</CardTitle>
        </div>
        <div className="pt-2">
          {displayPrice === 0 ? (
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{tPlans("free")}</span>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{price}</span>
                <span className="text-muted-foreground text-sm">
                  {tPlans(billingCycle === "yearly" ? "perYear" : "perMonth")}
                </span>
              </div>
              {billingCycle === "yearly" && savings > 0 && (
                <div className="mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {tPlans("save", { percentage: number(savings) })}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <ul className="space-y-2.5">
          {features.map((feature) => (
            <li key={feature.key} className="flex items-start gap-2 text-sm">
              {feature.included ? (
                <Check className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
              )}
              <span
                className={feature.included ? "" : "text-muted-foreground"}
              >
                {tPlans(`features.${feature.key}`, featureParams(feature))}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isOwner ? (
          isCurrent ? (
            <Button className="w-full" variant="outline" disabled>
              <Check className="h-4 w-4 me-2" />
              {t("currentBadge")}
            </Button>
          ) : (
            <Button
              className="cursor-pointer w-full"
              variant={isPro ? "default" : "outline"}
              onClick={() => onSelect(plan)}
            >
              {t("switchTo", { plan: name })}
            </Button>
          )
        ) : (
          <Button className="w-full" variant="outline" disabled>
            {t("ownerOnlyLong")}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
