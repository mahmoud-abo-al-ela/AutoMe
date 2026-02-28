"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PlanSelectionFooter({
    onPrev,
    selectedPlanId,
    loading,
    errors,
}) {
    return (
        <>
            {errors.planId && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 text-center font-medium"
                >
                    Please select a plan to continue
                </motion.p>
            )}

            {/* Help Text */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center bg-blue-50 p-4 rounded-xl border border-blue-100"
            >
                <p className="text-sm text-gray-700">
                    All plans include secure data storage and email support.{" "}
                    <a
                        href="mailto:sales@autome.com"
                        className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                    >
                        Contact sales
                    </a>{" "}
                    for custom solutions.
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
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Back
                </Button>
                <Button
                    type="submit"
                    disabled={!selectedPlanId || loading}
                    data-continue-btn
                    className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            Continue
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </>
                    )}
                </Button>
            </motion.div>
        </>
    );
}
