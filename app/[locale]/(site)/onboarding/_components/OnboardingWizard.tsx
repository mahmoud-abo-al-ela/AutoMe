"use client";

import {
  WizardHeader,
  StepIndicators,
  StepContent,
  useWizard,
} from "./wizard";
import type {
  OnboardingPlan,
  OnboardingUser,
} from "../_lib/onboarding-types";

export default function OnboardingWizard({
  user,
  plans,
}: {
  user: OnboardingUser;
  plans: OnboardingPlan[];
}) {
  const {
    restored,
    currentStep,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    steps,
  } = useWizard(user?.email);

  // One frame, while the saved draft is read. Rendering the steps first would
  // freeze the empty defaults into react-hook-form and throw the draft away.
  if (!restored) return null;

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <WizardHeader />

        <StepIndicators steps={steps} currentStep={currentStep} />

        <StepContent
          currentStep={currentStep}
          formData={formData}
          updateFormData={updateFormData}
          nextStep={nextStep}
          prevStep={prevStep}
          plans={plans}
          userId={user.id}
        />
      </div>
    </div>
  );
}
