"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { planFeatureKeys } from "@/components/Pricing/pricing-plans";
import { useFormatters } from "@/hooks/use-formatters";
import type { OnboardingPlan } from "../../_lib/onboarding-types";

export function PlanFeatureList({ plan }: { plan: OnboardingPlan }) {
    const t = useTranslations("plans");
    const fmt = useFormatters();
    const features = planFeatureKeys(plan);

    return (
        <ul className="space-y-3">
            {features.map((feature) => (
                <motion.li
                    key={feature.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-3 text-sm"
                >
                    {feature.included ? (
                        <div className="p-1 bg-positive-soft rounded-full">
                            <Check className="h-4 w-4 text-positive flex-shrink-0" />
                        </div>
                    ) : (
                        <div className="p-1 bg-muted rounded-full">
                            <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                    )}
                    <span
                        className={
                            feature.included
                                ? "text-foreground font-medium"
                                : "text-muted-foreground"
                        }
                    >
                        {t(
                            `features.${feature.key}`,
                            // The limit is formatted here rather than left to
                            // ICU, which would render Western digits against
                            // the Eastern ones everywhere else on the card.
                            feature.params
                                ? { count: feature.params.count, value: fmt.number(feature.params.count) }
                                : undefined
                        )}
                    </span>
                </motion.li>
            ))}
        </ul>
    );
}
