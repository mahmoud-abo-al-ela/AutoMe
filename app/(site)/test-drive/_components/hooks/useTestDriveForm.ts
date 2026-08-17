"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { requestTestDrive, getBookedTimeSlots } from "@/actions/test-drive";
import {
    dayOfWeekFor,
    filterAvailableTimeSlots,
    generateTimeSlots,
    makeIsDateDisabled,
    type DayOfWeek,
    type TestDriveFormValues,
    type WorkingHours,
} from "../../_lib/scheduling";

const testDriveSchema = z.object({
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    notes: z.string().optional(),
});

export const useTestDriveForm = ({
    carId,
    workingHours,
    onSuccess,
}: {
    carId: string;
    workingHours: WorkingHours;
    onSuccess: () => void;
}) => {
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
            toast.error("The dealership is closed on this day");
            return;
        }

        setValue("date", dateString);
        setSelectedDay(dayOfWeek);
        setCalendarOpen(false);

        setValue("startTime", "");
        setValue("endTime", "");

        const { openTime, closeTime } = workingHours[dayOfWeek];
        const allSlots = generateTimeSlots(openTime, closeTime);

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
            toast.error("Car information is missing");
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
                toast.success("Test drive scheduled successfully!");
                onSuccess();
            } else {
                toast.error(result.error.message || "Failed to schedule test drive");
            }
        } catch (error) {
            console.error("Error scheduling test drive:", error);
            toast.error("An unexpected error occurred");
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
