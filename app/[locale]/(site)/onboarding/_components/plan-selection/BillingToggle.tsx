"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useDirection } from "@radix-ui/react-direction";
import { useFormatters } from "@/hooks/use-formatters";
import type { BillingPeriod } from "../../_lib/onboarding-types";

/** Track is w-16 (64px), knob is w-6 (24px), inset 4px on each side. */
const KNOB_TRAVEL = 36;

export function BillingToggle({
    billingPeriod,
    onToggle,
    savingsPercentage,
}: {
    billingPeriod: BillingPeriod;
    onToggle: () => void;
    savingsPercentage: number;
}) {
    const t = useTranslations("plans");
    const fmt = useFormatters();
    const direction = useDirection();
    const isYearly = billingPeriod === "yearly";
    // A CSS transform is physical: translateX(+n) moves right in both writing
    // directions, and `dir` does not flip it. Without this the Arabic knob
    // rests at the wrong end of the track and animates away from the label it
    // selects.
    const knobOffset = direction === "rtl" ? -KNOB_TRAVEL : KNOB_TRAVEL;

    return (
        <div className="flex items-center justify-center gap-4">
            <span
                className={`text-sm font-semibold transition-colors ${billingPeriod === "monthly" ? "text-foreground" : "text-muted-foreground"
                    }`}
            >
                {t("monthly")}
            </span>
            <button
                type="button"
                role="switch"
                aria-checked={isYearly}
                aria-label={t("billingPeriodLabel")}
                onClick={onToggle}
                className="cursor-pointer relative inline-flex h-8 w-16 items-center rounded-full bg-inverse transition-colors hover:bg-inverse-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
                <motion.span
                    className="absolute start-1 inline-block h-6 w-6 transform rounded-full bg-card"
                    animate={{ x: isYearly ? knobOffset : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </button>
            <span
                className={`text-sm font-semibold transition-colors ${billingPeriod === "yearly" ? "text-foreground" : "text-muted-foreground"
                    }`}
            >
                {t("yearly")}
            </span>
            {/* Shown on both settings, not just once yearly is picked —
                otherwise the incentive is invisible to anyone who never
                flips the switch. */}
            {savingsPercentage > 0 && (
                <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ms-2 inline-flex items-center rounded-full bg-positive-soft px-3 py-1 text-xs font-semibold text-positive"
                >
                    {t(isYearly ? "saving" : "save", {
                        percentage: fmt.number(savingsPercentage),
                    })}
                </motion.span>
            )}
        </div>
    );
}
