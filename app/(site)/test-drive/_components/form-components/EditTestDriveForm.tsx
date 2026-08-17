"use client";

import { Card } from "@/components/ui/card";
import DateSelector from "./DateSelector";
import TimeSelector from "./TimeSelector";
import NotesField from "./NotesField";
import FormActions from "./FormActions";
import { useEditTestDriveForm } from "../hooks";
import type { WorkingHours } from "../../_lib/scheduling";
import type { TestDriveDetail } from "../../_lib/test-drive-types";

const EditTestDriveForm = ({
    testDrive,
    workingHours,
    carId,
    onCancel,
    onSuccess,
}: {
    testDrive: TestDriveDetail;
    workingHours: WorkingHours;
    carId: string;
    onCancel: () => void;
    onSuccess: () => void;
}) => {
    const {
        register,
        handleSubmit,
        errors,
        watchDate,
        watchStartTime,
        submitting,
        selectedDay,
        availableDates,
        availableTimeSlots,
        calendarOpen,
        setCalendarOpen,
        handleDateChange,
        handleStartTimeSelect,
        handleEndTimeSelect,
        getAvailableEndTimes,
        isDateDisabled,
        onSubmit,
    } = useEditTestDriveForm({ testDrive, workingHours, carId, onSuccess });

    return (
        <div className="min-h-[400px] md:min-h-[500px]">
            <Card className="p-4 md:p-6 mx-2 md:mx-0 gap-3">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h2 className="text-xl font-semibold">{testDrive.car?.title}</h2>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {testDrive.status}
                    </span>
                </div>

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
                                label="Start Time"
                                timeSlots={availableTimeSlots}
                                onTimeSelect={handleStartTimeSelect}
                                disabled={
                                    !watchDate || availableTimeSlots.length === 0 || submitting
                                }
                                error={errors.startTime?.message}
                                defaultValue={testDrive.startTime}
                            />
                            <input type="hidden" {...register("startTime")} />
                        </div>

                        <div>
                            <TimeSelector
                                label="End Time"
                                timeSlots={getAvailableEndTimes()}
                                onTimeSelect={handleEndTimeSelect}
                                disabled={
                                    !watchStartTime ||
                                    getAvailableEndTimes().length === 0 ||
                                    submitting
                                }
                                error={errors.endTime?.message}
                                defaultValue={testDrive.endTime}
                            />
                            <input type="hidden" {...register("endTime")} />
                        </div>
                    </div>

                    <NotesField register={register} disabled={submitting} />

                    <FormActions
                        variant="split"
                        onCancel={onCancel}
                        submitting={submitting}
                        cancelText="Cancel"
                        submitText="Save"
                        loadingText="Updating..."
                    />
                </form>
            </Card>
        </div>
    );
};

export default EditTestDriveForm;