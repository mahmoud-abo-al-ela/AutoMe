"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { requestTestDrive, getBookedTimeSlots } from "@/actions/test-drive";
import {
    dayOfWeekFor,
    filterAvailableTimeSlots,
    filterPastTimeSlots,
    generateTimeSlots,
    makeIsDateDisabled,
    type DayOfWeek,
    type TestDriveFormValues,
    type WorkingHours,
} from "../../_lib/scheduling";

export const useTestDriveForm = ({
    carId,
    workingHours,
    onSuccess,
}: {
    carId: string;
    workingHours: WorkingHours;
    onSuccess: () => void;
}) => {
    const t = useTranslations("testDrive");

    // Built inside the hook because the messages are translated: a module-level
    // schema would freeze whichever locale happened to load the module first.
    const testDriveSchema = useMemo(
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
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
    const [calendarOpen, setCalendarOpen] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm<TestDriveFormValues>({
        resolver: zodResolver(testDriveSchema),
        defaultValues: {
            date: "",
            startTime: "",
            endTime: "",
            notes: "",
        },
    });

    const watchDate = watch("date");
    const watchStartTime = watch("startTime");

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

        setValue("startTime", "");
        setValue("endTime", "");

        const { openTime, closeTime } = workingHours[dayOfWeek];
        // Opening hours say a 09:00 slot exists; they do not say it is still
        // bookable at 14:00. On any other date this is a no-op.
        const allSlots = filterPastTimeSlots(
            generateTimeSlots(openTime, closeTime),
            dateString
        );

        try {
            // Fetch booked time slots for this date and car
            const bookedSlotsResult = await getBookedTimeSlots(carId, dateString);

            if (bookedSlotsResult.success) {
                setAvailableTimeSlots(
                    filterAvailableTimeSlots(allSlots, bookedSlotsResult.data || [])
                );
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
        if (!carId) {
            toast.error(t("toasts.carMissing"));
            return;
        }

        setSubmitting(true);

        try {
            const result = await requestTestDrive({
                carId,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime,
                notes: data.notes || "",
            });

            if (result.success) {
                toast.success(t("toasts.scheduled"));
                onSuccess();
            } else {
                toast.error(result.error.message || t("toasts.scheduleFailed"));
            }
        } catch (error) {
            console.error("Error scheduling test drive:", error);
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
