"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";

export default function WorkingHoursHeader() {
    const t = useTranslations("onboarding.workingHours");

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4 bg-card p-6 rounded-control border border-border"
        >
            <div className="p-3 rounded-control border-2 border-border-strong bg-marker">
                <Clock className="h-6 w-6" />
            </div>
            <div className="flex-1">
                <h2 className="text-h2 font-extrabold">
                    {t("title")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
            </div>
        </motion.div>
    );
}
