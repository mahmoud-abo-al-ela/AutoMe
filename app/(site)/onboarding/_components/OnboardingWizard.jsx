"use client";

import {
  WizardHeader,
  StepIndicators,
  StepContent,
  useWizard,
} from "./wizard";

export default function OnboardingWizard({ user, plans }) {
  const {
    currentStep,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    steps,
  } = useWizard(user?.email);

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
