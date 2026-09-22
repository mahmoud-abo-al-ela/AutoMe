"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import Step1OrgDetails from "../Step1OrgDetails";
import Step2WorkingHours from "../Step2WorkingHours";
import Step3PlanSelection from "../Step3PlanSelection";
import type {
    OnboardingFormData,
    OnboardingPlan,
    UpdateFormData,
} from "../../_lib/onboarding-types";

export default function StepContent({
    currentStep,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    plans,
    userId,
}: {
    currentStep: number;
    formData: OnboardingFormData;
    updateFormData: UpdateFormData;
    nextStep: () => void;
    prevStep: () => void;
    plans: OnboardingPlan[];
    userId: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
        >
            <Card className="shadow-2xl border-0 overflow-hidden">
                <CardContent className="pt-8 pb-8 px-6 sm:px-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {currentStep === 1 && (
                                <Step1OrgDetails
                                    formData={formData}
                                    updateFormData={updateFormData}
                                    onNext={nextStep}
                                />
                            )}
                            {currentStep === 2 && (
                                <Step2WorkingHours
                                    formData={formData}
                                    updateFormData={updateFormData}
                                    onNext={nextStep}
                                    onPrev={prevStep}
                                />
                            )}
                            {currentStep === 3 && (
                                <Step3PlanSelection
                                    plans={plans}
                                    formData={formData}
                                    updateFormData={updateFormData}
                                    onPrev={prevStep}
                                    userId={userId}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    );
}
