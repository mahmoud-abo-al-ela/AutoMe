"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Create Your Dealership</h1>
        <p className="text-muted-foreground">
          Set up your online presence in just a few steps
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-4">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          {steps.map((step) => {
            const StepIcon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            
            return (
              <div
                key={step.id}
                className={`flex flex-col items-center gap-2 ${
                  isCurrent ? "text-primary" : isCompleted ? "text-green-600" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                    isCurrent
                      ? "border-primary bg-primary/10"
                      : isCompleted
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-muted"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.name}</span>
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
          {currentStep === 4 && (
            <Step4Complete createdOrg={createdOrg} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
