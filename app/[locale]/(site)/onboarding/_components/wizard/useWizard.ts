"use client";

import { useState, useEffect, useCallback } from "react";
import { useDirection } from "@radix-ui/react-direction";
import { STEPS, DEFAULT_FORM_DATA } from "./constants";
import {
    readOnboardingDraft,
    writeOnboardingDraft,
} from "../../_lib/onboarding-draft";
import type {
    OnboardingFormData,
    UpdateFormData,
} from "../../_lib/onboarding-types";

export function useWizard(userEmail?: string | null) {
    const direction = useDirection();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<OnboardingFormData>({
        ...DEFAULT_FORM_DATA,
        email: userEmail || "",
    });

    // Nothing is rendered until the draft has been looked for. Step 1 hands
    // its values to react-hook-form as `defaultValues`, which are read once on
    // the first render — restoring a tick later would leave the fields empty
    // while the wizard believed they were filled.
    const [restored, setRestored] = useState(false);

    // Reading storage during render would put different markup on the server
    // and the client, so it happens on mount.
    useEffect(() => {
        const draft = readOnboardingDraft();

        if (draft) {
            setFormData(draft.formData);
            setCurrentStep(draft.currentStep);
        }

        setRestored(true);
    }, []);

    useEffect(() => {
        // Guarded, or the first render would overwrite a real draft with the
        // empty defaults before the effect above has read it.
        if (!restored) return;

        writeOnboardingDraft(formData, currentStep);
    }, [formData, currentStep, restored]);

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

    // Keyboard navigation. Arrow keys are physical, not logical: in Arabic the
    // wizard runs right-to-left, so the key that means "go back" is the one
    // pointing at the previous step, which is ArrowRight.
    useEffect(() => {
        const backKey = direction === "rtl" ? "ArrowRight" : "ArrowLeft";

        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't interfere with form inputs
            const target = e.target as HTMLElement | null;
            if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
                return;
            }

            if (e.key === backKey && currentStep > 1 && currentStep < STEPS.length) {
                prevStep();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentStep, prevStep, direction]);

    return {
        restored,
        currentStep,
        formData,
        progress,
        updateFormData,
        nextStep,
        prevStep,
        steps: STEPS,
    };
}
