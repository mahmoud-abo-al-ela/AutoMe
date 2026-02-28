"use client";

import StepIndicator from "./StepIndicator";

export default function StepIndicators({ steps, currentStep }) {
    return (
        <div className="flex justify-between gap-2 sm:gap-4">
            {steps.map((step, index) => (
                <StepIndicator
                    key={step.id}
                    step={step}
                    index={index}
                    currentStep={currentStep}
                />
            ))}
        </div>
    );
}
