"use client";

import {
  WorkingHoursHeader,
  WorkingHoursGrid,
  WorkingHoursFooter,
  useWorkingHours,
} from "./working-hours";
import type {
  OnboardingFormData,
  UpdateFormData,
} from "../_lib/onboarding-types";

export default function Step2WorkingHours({
  formData,
  updateFormData,
  onNext,
  onPrev,
}: {
  formData: OnboardingFormData;
  updateFormData: UpdateFormData;
  onNext: () => void;
  onPrev: () => void;
}) {
  const { control, handleSubmit, workingHours, loading, onSubmit } =
    useWorkingHours({ formData, updateFormData, onNext });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <WorkingHoursHeader />

      <WorkingHoursGrid workingHours={workingHours} control={control} />

      <WorkingHoursFooter onPrev={onPrev} loading={loading} />
    </form>
  );
}
