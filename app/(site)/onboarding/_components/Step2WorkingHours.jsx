"use client";

import {
  WorkingHoursHeader,
  WorkingHoursGrid,
  WorkingHoursFooter,
  HoursPresets,
  useWorkingHours,
} from "./working-hours";

export default function Step2WorkingHours({
  formData,
  updateFormData,
  onNext,
  onPrev,
}) {
  const { control, handleSubmit, workingHours, loading, onSubmit, setValue } =
    useWorkingHours({ formData, updateFormData, onNext });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <WorkingHoursHeader />

      <HoursPresets setValue={setValue} workingHours={workingHours} />

      <WorkingHoursGrid workingHours={workingHours} control={control} />

      <WorkingHoursFooter onPrev={onPrev} loading={loading} />
    </form>
  );
}
