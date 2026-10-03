"use client";

import { motion } from "framer-motion";
import { CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
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
    const t = useTranslations("onboarding.planSelection");

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
        >
            <div className="inline-flex items-center justify-center gap-3 bg-card p-4 rounded-control border border-border">
                <div className="p-3 rounded-control border-2 border-border-strong bg-marker">
                    <CreditCard className="h-6 w-6" />
                </div>
                <div className="text-start">
                    <h2 className="text-h2 font-extrabold">
                        {t("title")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
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
