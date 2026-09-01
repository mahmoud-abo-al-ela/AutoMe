"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { editTestDrive, getBookedTimeSlots } from "@/actions/test-drive";
import {
    dayOfWeekFor,
    filterAvailableTimeSlots,
    filterPastTimeSlots,
    generateAvailableDates,
    generateTimeSlots,
    makeIsDateDisabled,
    type DayOfWeek,
    type TestDriveFormValues,
    type WorkingHours,
} from "../../_lib/scheduling";
import type { TestDriveDetail } from "../../_lib/test-drive-types";

export const useEditTestDriveForm = ({
    testDrive,
    workingHours,
    carId,
    onSuccess,
}: {
    testDrive: TestDriveDetail;
    workingHours: WorkingHours;
    carId: string;
    onSuccess: () => void;
}) => {
    const t = useTranslations("testDrive");

    // See useTestDriveForm: the schema carries translated messages, so it has
    // to be built per-locale rather than once at module load.
    const editTestDriveSchema = useMemo(
        () =>
            z.object({
                date: z.string().min(1, t("form.validation.dateRequired")),
                startTime: z.string().min(1, t("form.validation.startTimeRequired")),
                endTime: z.string().min(1, t("form.validation.endTimeRequired")),
                notes: z.string().optional(),
            }),
        [t]
    );

    const [submitting, setSubmitting] = useState(false);
    const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
    const [availableDates, setAvailableDates] = useState<Date[]>([]);
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
    const [calendarOpen, setCalendarOpen] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm<TestDriveFormValues>({
        resolver: zodResolver(editTestDriveSchema),
        defaultValues: {
            date: format(new Date(testDrive.date), "yyyy-MM-dd"),
            startTime: testDrive.startTime,
            endTime: testDrive.endTime,
            notes: testDrive.notes || "",
        },
    });

    const watchDate = watch("date");
    const watchStartTime = watch("startTime");

    /**
     * Slots for a date, minus existing bookings — but keeping this test drive's
     * own slot, which would otherwise disqualify the booking being edited.
     */
    const loadTimeSlots = useCallback(
        async (dateString: string, hours: { openTime: string; closeTime: string }) => {
            // Same rule as the create form: today's slots stop being offered
            // once they have passed.
            const allSlots = filterPastTimeSlots(
                generateTimeSlots(hours.openTime, hours.closeTime),
                dateString
            );

            try {
                const bookedSlotsResult = await getBookedTimeSlots(carId, dateString);

                if (bookedSlotsResult.success) {
                    const others = (bookedSlotsResult.data || []).filter(
                        (slot) =>
                            !(
                                slot.startTime === testDrive.startTime &&
                                slot.endTime === testDrive.endTime
                            )
                    );
                    setAvailableTimeSlots(filterAvailableTimeSlots(allSlots, others));
                } else {
                    // If there's an error fetching booked slots, show all slots
                    console.warn(
                        "Could not fetch booked time slots:",
                        bookedSlotsResult.error
                    );
                    setAvailableTimeSlots(allSlots);
                }
            } catch (error) {
                console.error("Error fetching booked time slots:", error);
                // Fallback to showing all slots if there's an error
                setAvailableTimeSlots(allSlots);
            }
        },
        [carId, testDrive.startTime, testDrive.endTime]
    );

    // Seed the calendar and the slots for whichever date is currently selected
    useEffect(() => {
        setAvailableDates(generateAvailableDates(workingHours));

        if (!watchDate) return;

        const dayOfWeek = dayOfWeekFor(new Date(watchDate));
        setSelectedDay(dayOfWeek);

        const hours = workingHours[dayOfWeek];
        if (hours) {
            loadTimeSlots(watchDate, hours);
        }
    }, [workingHours, watchDate, loadTimeSlots]);

    // Date selection handler
    const handleDateChange = async (date: Date | undefined) => {
        if (!date) return;

        const dateString = format(date, "yyyy-MM-dd");
        const dayOfWeek = dayOfWeekFor(date);

        if (!workingHours[dayOfWeek]?.isOpen) {
            toast.error(t("toasts.closedOnDay"));
            return;
        }

        setValue("date", dateString);
        setSelectedDay(dayOfWeek);
        setCalendarOpen(false);

        // Reset time selections
        setValue("startTime", "");
        setValue("endTime", "");

        await loadTimeSlots(dateString, workingHours[dayOfWeek]);
    };

    // Time selection handlers
    const handleStartTimeSelect = (time: string) => {
        setValue("startTime", time);
        setValue("endTime", "");
    };

    const handleEndTimeSelect = (time: string) => {
        setValue("endTime", time);
    };

    // Get available end times based on selected start time
    const getAvailableEndTimes = () => {
        if (!watchStartTime || availableTimeSlots.length === 0) return [];

        const startIndex = availableTimeSlots.indexOf(watchStartTime);
        if (startIndex === -1) return [];

        return availableTimeSlots.slice(startIndex + 1);
    };

    // Form submission handler
    const onSubmit = async (data: TestDriveFormValues) => {
        setSubmitting(true);

        try {
            const result = await editTestDrive({
                testDriveId: testDrive.id,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                notes: data.notes || "",
            });

            if (result.success) {
                toast.success(t("toasts.updated"));
                onSuccess();
            } else {
                toast.error(result.error.message || t("toasts.updateFailed"));
            }
        } catch (error) {
            console.error("Error updating test drive:", error);
            toast.error(t("toasts.unexpected"));
        } finally {
            setSubmitting(false);
        }
    };

    return {
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
        isDateDisabled: makeIsDateDisabled(workingHours),
        onSubmit,
    };
};
