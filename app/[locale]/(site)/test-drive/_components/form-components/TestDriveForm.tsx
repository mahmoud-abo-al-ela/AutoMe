"use client";

import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import DateSelector from "./DateSelector";
import TimeSelector from "./TimeSelector";
import NotesField from "./NotesField";
import FormActions from "./FormActions";
import { useTestDriveForm } from "../hooks";
import type { WorkingHours } from "../../_lib/scheduling";

const TestDriveForm = ({
    carId,
    workingHours,
    availableDates,
    onSuccess,
}: {
    carId: string;
    workingHours: WorkingHours;
    availableDates: Date[];
    onSuccess: () => void;
}) => {
    const t = useTranslations("testDrive.form");

    const {
        register,
        handleSubmit,
        errors,
        watchDate,
        watchStartTime,
        submitting,
        selectedDay,
        availableTimeSlots,
        calendarOpen,
        setCalendarOpen,
        handleDateChange,
        handleStartTimeSelect,
        handleEndTimeSelect,
        getAvailableEndTimes,
        isDateDisabled,
        onSubmit,
    } = useTestDriveForm({ carId, workingHours, onSuccess });

    return (
        <Card className="p-4 md:p-6 mx-2 md:mx-0 gap-3">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <DateSelector
                    selectedDate={watchDate}
                    onDateChange={handleDateChange}
                    isDateDisabled={isDateDisabled}
                    error={errors.date?.message}
                    disabled={availableDates.length === 0 || submitting}
                    calendarOpen={calendarOpen}
                    setCalendarOpen={setCalendarOpen}
                    selectedDay={selectedDay}
                    workingHours={workingHours}
                />
                <input type="hidden" {...register("date")} />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <TimeSelector
                            label={t("startTime")}
                            timeSlots={availableTimeSlots}
                            onTimeSelect={handleStartTimeSelect}
                            disabled={
                                !watchDate || availableTimeSlots.length === 0 || submitting
                            }
                            error={errors.startTime?.message}
                        />
                        <input type="hidden" {...register("startTime")} />
                    </div>

                    <div>
                        <TimeSelector
                            label={t("endTime")}
                            timeSlots={getAvailableEndTimes()}
                            onTimeSelect={handleEndTimeSelect}
                            disabled={
                                !watchStartTime ||
                                getAvailableEndTimes().length === 0 ||
                                submitting
                            }
                            error={errors.endTime?.message}
                        />
                        <input type="hidden" {...register("endTime")} />
                    </div>
                </div>

                <NotesField register={register} disabled={submitting} />

                <FormActions
                    submitting={submitting}
                    submitText={t("submit")}
                    loadingText={t("processing")}
                />
            </form>
        </Card>
    );
};

export default TestDriveForm;