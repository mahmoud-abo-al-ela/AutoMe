"use client";

import {
  WorkingHoursHeader,
  WorkingHoursGrid,
  WorkingHoursFooter,
  useWorkingHours,
} from "./working-hours";

export default function Step2WorkingHours({
  formData,
  updateFormData,
  onNext,
  onPrev,
}) {
  const { control, handleSubmit, workingHours, loading, onSubmit } =
    useWorkingHours({ formData, updateFormData, onNext });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <WorkingHoursHeader />

      <WorkingHoursGrid workingHours={workingHours} control={control} />

      <WorkingHoursFooter onPrev={onPrev} loading={loading} />
    </form>
  );
}
