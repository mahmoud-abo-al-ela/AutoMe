"use client";

import {
  WizardHeader,
  ProgressBar,
  StepIndicators,
  StepContent,
  useWizard,
} from "./wizard";

export default function OnboardingWizard({ user, plans }) {
  const {
    currentStep,
    formData,
    progress,
    updateFormData,
    nextStep,
    prevStep,
    steps,
  } = useWizard(user?.email);

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <WizardHeader />

        <ProgressBar
          currentStep={currentStep}
          totalSteps={steps.length}
          progress={progress}
        />

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
