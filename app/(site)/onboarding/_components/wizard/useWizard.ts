"use client";

import { useState, useEffect, useCallback } from "react";
import { STEPS, DEFAULT_FORM_DATA } from "./constants";
import type {
    OnboardingFormData,
    UpdateFormData,
} from "../../_lib/onboarding-types";

export function useWizard(userEmail?: string | null) {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<OnboardingFormData>({
        ...DEFAULT_FORM_DATA,
        email: userEmail || "",
    });

    const progress = (currentStep / STEPS.length) * 100;

    const updateFormData: UpdateFormData = (updates) => {
        setFormData((prev) => ({ ...prev, ...updates }));
    };

    const nextStep = useCallback(() => {
        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [currentStep]);

    const prevStep = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [currentStep]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't interfere with form inputs
            const target = e.target as HTMLElement | null;
            if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
                return;
            }

            if (e.key === "ArrowLeft" && currentStep > 1 && currentStep < STEPS.length) {
                prevStep();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentStep, prevStep]);

    return {
        currentStep,
        formData,
        progress,
        updateFormData,
        nextStep,
        prevStep,
        steps: STEPS,
    };
}
