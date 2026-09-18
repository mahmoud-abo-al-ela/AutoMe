"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

export default function WorkingHoursFooter({
    onPrev,
    loading,
}: {
    onPrev: () => void;
    loading: boolean;
}) {
    const t = useTranslations("onboarding.actions");

    return (
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
                disabled={loading}
                className="cursor-pointer px-6 py-6 text-base font-semibold"
            >
                <ArrowLeft className="h-5 w-5 me-2 rtl:rotate-180" />
                {t("back")}
            </Button>
            <Button
                type="submit"
                disabled={loading}
                className="cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
                {loading ? (
                    <>
                        <Loader2 className="h-5 w-5 me-2 animate-spin" />
                        {t("loading")}
                    </>
                ) : (
                    <>
                        {t("continue")}
                        <ArrowRight className="h-5 w-5 ms-2 rtl:rotate-180" />
                    </>
                )}
            </Button>
        </motion.div>
    );
}
