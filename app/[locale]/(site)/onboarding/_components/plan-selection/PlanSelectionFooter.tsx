"use client";

import { motion } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    Loader2,
    ShieldCheck,
    RefreshCw,
    CreditCard,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { FieldErrors } from "react-hook-form";
import type { PlanSelectionFormValues } from "./usePlanSelection";

const SALES_EMAIL = "sales@autome.com";

export function PlanSelectionFooter({
    onPrev,
    selectedPlanId,
    loading,
    errors,
}: {
    onPrev: () => void;
    selectedPlanId: string;
    loading: boolean;
    errors: FieldErrors<PlanSelectionFormValues>;
}) {
    const t = useTranslations("onboarding.planSelection");
    const tActions = useTranslations("onboarding.actions");

    return (
        <>
            {errors.planId && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 text-center font-medium"
                >
                    {t("noPlanSelected")}
                </motion.p>
            )}

            {/* Reassurance sits immediately above the CTA — this is the step
                where people hesitate, and the objections are all about
                commitment and payment safety. */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600"
            >
                <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    {t("trust.stripe")}
                </span>
                <span className="flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4 text-green-600" />
                    {t("trust.cancelAnytime")}
                </span>
                <span className="flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    {t("trust.noSetupFees")}
                </span>
            </motion.div>

            {/* Help Text. One message with the link inside it rather than three
                siblings: Arabic does not put the clause in the same order, and
                no amount of RTL flipping fixes word order. */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center bg-blue-50 p-4 rounded-xl border border-blue-100"
            >
                <p className="text-sm text-gray-700">
                    {t.rich("help", {
                        link: (chunks) => (
                            <a
                                href={`mailto:${SALES_EMAIL}`}
                                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                            >
                                {chunks}
                            </a>
                        ),
                    })}
                </p>
            </motion.div>

            {/* Navigation Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex justify-between pt-4"
            >
                <Button
                    type="button"
                    variant="outline"
                    onClick={onPrev}
                    className="cursor-pointer px-6 py-6 text-base font-semibold"
                >
                    <ArrowLeft className="h-5 w-5 me-2 rtl:rotate-180" />
                    {tActions("back")}
                </Button>
                <Button
                    type="submit"
                    disabled={!selectedPlanId || loading}
                    data-continue-btn
                    className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-5 w-5 me-2 animate-spin" />
                            {tActions("processing")}
                        </>
                    ) : (
                        <>
                            {tActions("continue")}
                            <ArrowRight className="h-5 w-5 ms-2 rtl:rotate-180" />
                        </>
                    )}
                </Button>
            </motion.div>
        </>
    );
}
