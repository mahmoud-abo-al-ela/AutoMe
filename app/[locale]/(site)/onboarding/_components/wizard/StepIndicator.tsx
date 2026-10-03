"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { WizardStep } from "../../_lib/onboarding-types";

export default function StepIndicator({
    step,
    index,
    currentStep,
}: {
    step: WizardStep;
    index: number;
    currentStep: number;
}) {
    const t = useTranslations("onboarding.wizard.steps");
    const StepIcon = step.icon;
    const isCompleted = currentStep > step.id;
    const isCurrent = currentStep === step.id;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className={`flex w-24 shrink-0 flex-col items-center gap-2 sm:w-32 ${isCurrent
                    ? "text-foreground"
                    : isCompleted
                        ? "text-positive"
                        : "text-muted-foreground"
                }`}
        >
            <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`h-12 w-12 sm:h-14 sm:w-14 rounded-control flex items-center justify-center border-2 transition-all duration-300 ${isCurrent
                        ? "border-border-strong bg-marker shadow-key"
                        : isCompleted
                            ? "border-positive bg-positive text-white"
                            : "border-border bg-card"
                    }`}
            >
                {isCompleted ? (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 10,
                        }}
                    >
                        <Check className="h-6 w-6 sm:h-7 sm:w-7" />
                    </motion.div>
                ) : (
                    <StepIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                )}
            </motion.div>
            <div className="text-center">
                <span className="text-xs sm:text-sm font-semibold block whitespace-nowrap">
                    {t(`${step.key}.name`)}
                </span>
                <span className="text-micro sm:text-xs text-muted-foreground block">
                    {t(`${step.key}.description`)}
                </span>
            </div>
        </motion.div>
    );
}
