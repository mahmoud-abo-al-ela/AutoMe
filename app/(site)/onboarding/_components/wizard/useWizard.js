"use client";

import { useState, useEffect } from "react";
import { STEPS, DEFAULT_FORM_DATA } from "./constants";

export function useWizard(userEmail) {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        ...DEFAULT_FORM_DATA,
        email: userEmail || "",
    });

    const progress = (currentStep / STEPS.length) * 100;

    const updateFormData = (updates) => {
        setFormData((prev) => ({ ...prev, ...updates }));
    };

    const nextStep = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't interfere with form inputs
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
                return;
            }

            if (e.key === "ArrowLeft" && currentStep > 1 && currentStep < STEPS.length) {
                prevStep();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentStep]);

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
