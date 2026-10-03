"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    formatPlanPrice,
    planKeyFor,
    planPeriodKey,
} from "@/components/Pricing/pricing-plans";
import { useFormatters } from "@/hooks/use-formatters";
import { PlanFeatureList } from "./PlanFeatureList";
import { planSignupKind } from "@/lib/utils/plan-signup";
import type { PlanConfig } from "./constants";
import type {
    BillingPeriod,
    OnboardingPlan,
} from "../../_lib/onboarding-types";

export function PlanCard({
    plan,
    config,
    isSelected,
    onSelect,
    index,
    billingPeriod,
}: {
    plan: OnboardingPlan;
    config: PlanConfig;
    isSelected: boolean;
    onSelect: (planId: string) => void;
    index: number;
    billingPeriod: BillingPeriod;
}) {
    const t = useTranslations("onboarding.planSelection");
    const tPlans = useTranslations("plans");
    const fmt = useFormatters();
    const Icon = config.icon;
    const isPro = plan.type === "PRO";

    // A plan whose `type` the product does not know has no message key, so it
    // falls back to the untranslated name from the database rather than
    // rendering blank.
    const planKey = planKeyFor(plan.type);
    const name = planKey ? tPlans(`plans.${planKey}.name`) : plan.name;

    // Enterprise is quoted, not priced; anything else at zero is free.
    const price =
        plan.monthlyPrice === null || plan.monthlyPrice === 0
            ? tPlans(plan.type === "ENTERPRISE" ? "custom" : "free")
            : formatPlanPrice(plan, billingPeriod, fmt.locale);
    const periodKey = planPeriodKey(plan, billingPeriod);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -8 }}
            className="relative h-full"
        >
            <Card
                className={cn(
                    // h-full + column flex so every card fills the grid row and
                    // the footer sits at the bottom regardless of how many
                    // features the plan lists (Enterprise has one more).
                    "relative flex h-full flex-col cursor-pointer transition-all duration-300",
                    // While selected the tier's own border is dropped so the
                    // selection reads as a single state.
                    isSelected ? "z-10 border-2 border-foreground ring-2 ring-foreground" : config.border,
                )}
                onClick={() => onSelect(plan.id)}
            >
                {config.badgeKey && !isSelected && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
                    >
                        <Badge className="border-2 border-border-strong bg-marker px-4 py-1.5 text-sm font-semibold text-marker-foreground">
                            {tPlans(config.badgeKey)}
                        </Badge>
                    </motion.div>
                )}
                {isSelected && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
                    >
                        <Badge className="bg-inverse px-4 py-1.5 text-sm font-semibold text-inverse-foreground">
                            {t("selectedBadge")}
                        </Badge>
                    </motion.div>
                )}

                <CardHeader className="pb-4 relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.6 }}
                            className={cn("rounded-control p-3", config.tile)}
                        >
                            <Icon className="h-6 w-6" />
                        </motion.div>
                        <CardTitle className="text-xl font-bold">{name}</CardTitle>
                    </div>
                    <div className="pt-2">
                        <div className="flex items-baseline gap-1">
                            <span className="text-[2.5rem] font-black tabular-nums">
                                {price}
                            </span>
                            {/* A quoted plan has no period to name. */}
                            {periodKey && (
                                <span className="text-muted-foreground text-lg font-medium">
                                    /{tPlans(periodKey)}
                                </span>
                            )}
                        </div>
                        {/* A trial starts the dealership now; the first
                            payment is asked for before it ends. */}
                        {planSignupKind(plan) === "trial" && (
                            <p className="mt-2 text-sm font-medium text-positive">
                                {t("trial", {
                                    count: plan.trialDays,
                                    value: fmt.number(plan.trialDays),
                                })}
                            </p>
                        )}
                    </div>
                </CardHeader>

                {/* flex-1 absorbs the height difference, so shorter feature
                    lists pad out instead of shrinking the card. */}
                <CardContent className="pb-4 relative z-10 flex-1">
                    <PlanFeatureList plan={plan} />
                </CardContent>

                <CardFooter className="relative z-10 mt-auto">
                    <Button
                        type="button"
                        variant={isSelected ? "inverse" : isPro ? "marker" : "outline-strong"}
                        size="xl"
                        className="w-full"
                        onClick={() => onSelect(plan.id)}
                    >
                        {isSelected ? (
                            <>
                                <Check className="h-5 w-5 me-2" />
                                {t("selected")}
                            </>
                        ) : (
                            <>
                                {t("select", { plan: name })}
                                <ArrowRight className="h-5 w-5 ms-2 rtl:rotate-180" />
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
