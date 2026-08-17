"use client";

import StepIndicator from "./StepIndicator";
import type { WizardStep } from "../../_lib/onboarding-types";

/**
 * The single source of progress in the wizard.
 *
 * This used to sit under a separate card showing "Step 1 of 3", "33% Complete"
 * and a filled bar — four indicators of the same fact, costing ~180px above the
 * fold. The stepper is the one worth keeping: it also says what is coming next.
 * The step count is folded in here; the progress bar card is gone.
 */
export default function StepIndicators({
    steps,
    currentStep,
}: {
    steps: WizardStep[];
    currentStep: number;
}) {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <p className="mb-4 text-sm font-semibold text-gray-500">
                Step {currentStep} of {steps.length}
            </p>

            <div className="flex items-start">
                {steps.map((step, index) => (
                    // Only the segments that carry a connector may grow. When
                    // the last one grew too it absorbed an equal share of the
                    // row with nothing to fill it, so the stepper stopped short
                    // of the right edge and the connectors came out uneven.
                    <div
                        key={step.id}
                        className={`flex items-start ${
                            index < steps.length - 1 ? "flex-1" : "flex-none"
                        }`}
                    >
                        <StepIndicator
                            step={step}
                            index={index}
                            currentStep={currentStep}
                        />
                        {index < steps.length - 1 && (
                            // Connector doubles as the progress bar: it fills in
                            // as each step completes.
                            <div
                                aria-hidden
                                className={`mt-6 h-0.5 flex-1 rounded-full transition-colors duration-500 sm:mt-7 ${
                                    currentStep > step.id
                                        ? "bg-green-500"
                                        : "bg-gray-200"
                                }`}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
