"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

export default function WizardHeader() {
    const t = useTranslations("onboarding.wizard");

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
        >
            <div className="inline-flex items-center gap-2 bg-inverse text-inverse-foreground px-4 py-2 rounded-full text-sm font-semibold">
                <Sparkles className="h-4 w-4" />
                <span>{t("badge")}</span>
            </div>
            <h1 className="text-display font-black">
                {t("title")}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                {t("subtitle")}
            </p>
        </motion.div>
    );
}
