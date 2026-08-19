"use client";

import { motion } from "framer-motion";
import type { BillingPeriod } from "../../_lib/onboarding-types";

export function BillingToggle({
    billingPeriod,
    onToggle,
    savingsPercentage,
}: {
    billingPeriod: BillingPeriod;
    onToggle: () => void;
    savingsPercentage: number;
}) {
    return (
        <div className="flex items-center justify-center gap-4">
            <span
                className={`text-sm font-semibold transition-colors ${billingPeriod === "monthly" ? "text-gray-900" : "text-gray-500"
                    }`}
            >
                Monthly
            </span>
            <button
                type="button"
                onClick={onToggle}
                className="cursor-pointer relative inline-flex h-8 w-16 items-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                <motion.span
                    className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg"
                    animate={{
                        x: billingPeriod === "monthly" ? 4 : 36,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </button>
            <span
                className={`text-sm font-semibold transition-colors ${billingPeriod === "yearly" ? "text-gray-900" : "text-gray-500"
                    }`}
            >
                Yearly
            </span>
            {/* Shown on both settings, not just once yearly is picked —
                otherwise the incentive is invisible to anyone who never
                flips the switch. */}
            {savingsPercentage > 0 && (
                <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ms-2 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                >
                    {billingPeriod === "yearly"
                        ? `Saving ${savingsPercentage}%`
                        : `Save ${savingsPercentage}%`}
                </motion.span>
            )}
        </div>
    );
}
