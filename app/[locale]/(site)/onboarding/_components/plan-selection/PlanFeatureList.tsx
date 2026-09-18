"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { planFeatureKeys } from "@/components/Pricing/pricing-plans";
import { useFormatters } from "@/hooks/use-formatters";
import type { OnboardingPlan } from "../../_lib/onboarding-types";

/**
 * The bullets come from the same mapper the public pricing section uses, so the
 * two surfaces cannot describe the same plan differently.
 *
 * They used to be built here out of the Json column's own keys, split from
 * camelCase into Title Case — English by construction, and so untranslatable.
 * A flag that mapper does not know about is no longer listed rather than being
 * listed in the wrong language.
 */
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
                        <div className="p-1 bg-green-100 rounded-full">
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        </div>
                    ) : (
                        <div className="p-1 bg-gray-100 rounded-full">
                            <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </div>
                    )}
                    <span
                        className={
                            feature.included
                                ? "text-gray-800 font-medium"
                                : "text-gray-500"
                        }
                    >
                        {t(
                            `features.${feature.key}`,
                            // The limit is formatted here rather than left to
                            // ICU, which would render Western digits against
                            // the Eastern ones everywhere else on the card.
                            feature.params
                                ? { value: fmt.number(feature.params.count) }
                                : undefined
                        )}
                    </span>
                </motion.li>
            ))}
        </ul>
    );
}
