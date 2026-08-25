"use client";
import { useTranslations } from "next-intl";

import { motion } from "framer-motion";
import { useDirection } from "@radix-ui/react-direction";

/** Track is w-16 (64px), knob is w-6 (24px), inset 4px on each side. */
const KNOB_TRAVEL = 36;

export function BillingToggle({
    billingPeriod,
    onToggle,
    savingsPercentage,
}: {
    billingPeriod: string;
    onToggle: () => void;
    savingsPercentage?: number;
}) {
  const t = useTranslations("home.pricing");
  const direction = useDirection();
  const isYearly = billingPeriod === "yearly";
  // A CSS transform is physical: translateX(+n) moves right in both writing
  // directions, and `dir` does not flip it. Without this the Arabic knob rests
  // at the wrong end of the track and animates away from the label it selects.
  const knobOffset = direction === "rtl" ? -KNOB_TRAVEL : KNOB_TRAVEL;
    return (
        <div className="flex items-center justify-center gap-4 mb-8">
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
                className="cursor-pointer relative inline-flex h-8 w-16 items-center rounded-full bg-primary transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
                <motion.span
                    className="absolute start-1 inline-block h-6 w-6 transform rounded-full bg-white shadow-lg"
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
            {billingPeriod === "yearly" && (savingsPercentage ?? 0) > 0 && (
                <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ms-2 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                >
                    {t("save", { percentage: savingsPercentage ?? 0 })}
                </motion.span>
            )}
        </div>
    );
}
