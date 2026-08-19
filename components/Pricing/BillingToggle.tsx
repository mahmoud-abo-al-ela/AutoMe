"use client";

import { motion } from "framer-motion";

export function BillingToggle({
    billingPeriod,
    onToggle,
    savingsPercentage,
}: {
    billingPeriod: string;
    onToggle: () => void;
    savingsPercentage?: number;
}) {
    return (
        <div className="flex items-center justify-center gap-4 mb-8">
            <span
                className={`text-sm font-semibold transition-colors ${billingPeriod === "monthly" ? "text-foreground" : "text-muted-foreground"
                    }`}
            >
                Monthly
            </span>
            <button
                type="button"
                onClick={onToggle}
                className="cursor-pointer relative inline-flex h-8 w-16 items-center rounded-full bg-primary transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
                className={`text-sm font-semibold transition-colors ${billingPeriod === "yearly" ? "text-foreground" : "text-muted-foreground"
                    }`}
            >
                Yearly
            </span>
            {billingPeriod === "yearly" && (savingsPercentage ?? 0) > 0 && (
                <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ms-2 inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                >
                    Save {savingsPercentage}%
                </motion.span>
            )}
        </div>
    );
}
