"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, Building2, CreditCard, Clock, Rocket } from "lucide-react";
import Step1OrgDetails from "./Step1OrgDetails";
import Step2PlanSelection from "./Step2PlanSelection";
import Step3WorkingHours from "./Step3WorkingHours";
import Step4Complete from "./Step4Complete";

const steps = [
  { id: 1, name: "Organization Details", icon: Building2 },
  { id: 2, name: "Select Plan", icon: CreditCard },
  { id: 3, name: "Working Hours", icon: Clock },
  { id: 4, name: "Complete", icon: Rocket },
];

export default function OnboardingWizard({ user, plans }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    email: user?.email || "",
    phone: "",
    address: "",
    planId: null,
    workingHours: {
      monday: { open: "09:00", close: "18:00", closed: false },
      tuesday: { open: "09:00", close: "18:00", closed: false },
      wednesday: { open: "09:00", close: "18:00", closed: false },
      thursday: { open: "09:00", close: "18:00", closed: false },
      friday: { open: "09:00", close: "18:00", closed: false },
      saturday: { open: "10:00", close: "16:00", closed: false },
      sunday: { open: "10:00", close: "16:00", closed: true },
    },
  });
  const [createdOrg, setCreatedOrg] = useState(null);

  const progress = (currentStep / steps.length) * 100;

  const updateFormData = (updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
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

      if (e.key === "ArrowLeft" && currentStep > 1 && currentStep < 4) {
        prevStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Create Your Dealership
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Set up your online presence in just a few steps
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-4">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between gap-2">
          {steps.map((step) => {
            const StepIcon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={step.id}
                className={`flex flex-col items-center gap-2 flex-1 ${isCurrent
                  ? "text-primary"
                  : isCompleted
                    ? "text-green-600"
                    : "text-muted-foreground"
                  }`}
              >
                <div
                  className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center border-2 ${isCurrent
                    ? "border-primary bg-primary/10"
                    : isCompleted
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-muted"
                    }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <StepIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <Step1OrgDetails
              formData={formData}
              updateFormData={updateFormData}
              onNext={nextStep}
            />
          )}
          {currentStep === 2 && (
            <Step2PlanSelection
              plans={plans}
              formData={formData}
              updateFormData={updateFormData}
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}
          {currentStep === 3 && (
            <Step3WorkingHours
              formData={formData}
              updateFormData={updateFormData}
              onNext={nextStep}
              onPrev={prevStep}
              setCreatedOrg={setCreatedOrg}
              userId={user.id}
            />
          )}
          {currentStep === 4 && <Step4Complete createdOrg={createdOrg} />}
        </CardContent>
      </Card>

      {/* Keyboard hint */}
      {currentStep > 1 && currentStep < 4 && (
        <p className="text-xs text-center text-muted-foreground">
          Tip: Use left arrow key to go back
        </p>
      )}
    </div>
  );
}
