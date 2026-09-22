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
                    "relative flex h-full flex-col cursor-pointer transition-all duration-300 hover:shadow-2xl",
                    // While selected the plan's own accent colour is dropped so
                    // the green selection reads as a single state, rather than
                    // a purple/blue border competing with the green ring.
                    isSelected ? "border-green-500" : config.border,
                    isSelected
                        ? "ring-4 ring-green-500 shadow-2xl scale-105 z-10"
                        : "hover:scale-102",
                    isPro && !isSelected && "shadow-xl",
                )}
                onClick={() => onSelect(plan.id)}
            >
                {/* Background gradient */}
                <div
                    className={`absolute inset-0 bg-gradient-to-br ${config.bg} opacity-50 -z-10`}
                />

                {config.badgeKey && !isSelected && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        className="absolute -top-4 left-1/2 -translate-x-1/2 z-20"
                    >
                        <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-1.5 shadow-lg text-sm font-semibold">
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
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-1.5 shadow-lg text-sm font-semibold">
                            {t("selectedBadge")}
                        </Badge>
                    </motion.div>
                )}

                <CardHeader className="pb-4 relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.6 }}
                            className={cn(
                                "p-3 rounded-xl bg-white shadow-md",
                                config.color,
                            )}
                        >
                            <Icon className="h-6 w-6" />
                        </motion.div>
                        <CardTitle className="text-xl font-bold">{name}</CardTitle>
                    </div>
                    <div className="pt-2">
                        <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                                {price}
                            </span>
                            {/* A quoted plan has no period to name. */}
                            {periodKey && (
                                <span className="text-gray-600 text-lg font-medium">
                                    /{tPlans(periodKey)}
                                </span>
                            )}
                        </div>
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
                        className={`w-full h-12 text-base font-semibold transition-all duration-300 cursor-pointer hover:bg-transparent ${isSelected
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
                            : isPro
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                                : "bg-white border-2 hover:border-blue-500 text-gray-800"
                            }`}
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
