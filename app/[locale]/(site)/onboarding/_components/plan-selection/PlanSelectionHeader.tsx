"use client";

import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";
import { BillingToggle } from "./BillingToggle";
import type { BillingPeriod } from "../../_lib/onboarding-types";

export function PlanSelectionHeader({
    billingPeriod,
    onToggleBilling,
    savingsPercentage,
}: {
    billingPeriod: BillingPeriod;
    onToggleBilling: () => void;
    savingsPercentage: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
        >
            <div className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                    <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div className="text-start">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                        Choose Your Plan
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Select the perfect plan for your dealership. You can upgrade
                        anytime.
                    </p>
                </div>
            </div>

            <BillingToggle
                billingPeriod={billingPeriod}
                onToggle={onToggleBilling}
                savingsPercentage={savingsPercentage}
            />
        </motion.div>
    );
}
