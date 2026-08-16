"use client";

import {
  PlanSelectionHeader,
  PlanGrid,
  PlanSelectionFooter,
  usePlanSelection,
} from "./plan-selection";
import type {
  OnboardingFormData,
  OnboardingPlan,
  UpdateFormData,
} from "../_lib/onboarding-types";

export default function Step3PlanSelection({
  plans,
  formData,
  updateFormData,
  onPrev,
  userId,
}: {
  plans: OnboardingPlan[];
  formData: OnboardingFormData;
  updateFormData: UpdateFormData;
  onPrev: () => void;
  userId: string;
}) {
  const {
    selectedPlanId,
    loading,
    errors,
    billingPeriod,
    savingsPercentage,
    handleSelectPlan,
    handleSubmit,
    setBillingPeriod,
  } = usePlanSelection({
    plans,
    formData,
    updateFormData,
    userId,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <PlanSelectionHeader
        billingPeriod={billingPeriod}
        onToggleBilling={() =>
          setBillingPeriod((prev) => (prev === "monthly" ? "yearly" : "monthly"))
        }
        savingsPercentage={savingsPercentage}
      />

      <PlanGrid
        plans={plans}
        selectedPlanId={selectedPlanId}
        onSelectPlan={handleSelectPlan}
        billingPeriod={billingPeriod}
      />

      <PlanSelectionFooter
        onPrev={onPrev}
        selectedPlanId={selectedPlanId}
        loading={loading}
        errors={errors}
      />
    </form>
  );
}
