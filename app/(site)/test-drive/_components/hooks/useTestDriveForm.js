"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { requestTestDrive, getBookedTimeSlots } from "@/actions/test-drive";

const testDriveSchema = z.object({
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    notes: z.string().optional(),
});

// Function to generate time slots
const generateTimeSlots = (openTime, closeTime) => {
    const slots = [];
    const [openHour, openMinute] = openTime.split(":").map(Number);
    const [closeHour, closeMinute] = closeTime.split(":").map(Number);

    let currentHour = openHour;
    let currentMinute = openMinute;

    while (
        currentHour < closeHour ||
        (currentHour === closeHour && currentMinute < closeMinute)
    ) {
        slots.push(
            `${currentHour.toString().padStart(2, "0")}:${currentMinute
                .toString()
                .padStart(2, "0")}`
        );

        currentMinute += 30;
        if (currentMinute >= 60) {
            currentHour += 1;
            currentMinute = 0;
        }
    }

    return slots;
};

// Function to check if a time slot overlaps with booked slots
const isTimeSlotBooked = (timeSlot, bookedSlots) => {
    return bookedSlots.some(booked => {
        const slotTime = timeSlot;
        const bookedStart = booked.startTime;
        const bookedEnd = booked.endTime;

        // Check if the time slot falls within any booked period
        return slotTime >= bookedStart && slotTime < bookedEnd;
    });
};

// Function to filter available time slots by removing booked ones
const filterAvailableTimeSlots = (allSlots, bookedSlots) => {
    return allSlots.filter(slot => !isTimeSlotBooked(slot, bookedSlots));
};

export const useTestDriveForm = ({ carId, workingHours, onSuccess }) => {
    const [submitting, setSubmitting] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [calendarOpen, setCalendarOpen] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm({
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
    const handleDateChange = async (date) => {
        if (!date) return;

        const dateString = format(date, "yyyy-MM-dd");
        const dayOfWeek = {
            0: "SUNDAY",
            1: "MONDAY",
            2: "TUESDAY",
            3: "WEDNESDAY",
            4: "THURSDAY",
            5: "FRIDAY",
            6: "SATURDAY",
        }[date.getDay()];

        if (!workingHours[dayOfWeek]?.isOpen) {
            toast.error("The dealership is closed on this day");
            return;
        }

        setValue("date", dateString);
        setSelectedDay(dayOfWeek);
        setCalendarOpen(false);

        setValue("startTime", "");
        setValue("endTime", "");

        if (workingHours[dayOfWeek]) {
            const { openTime, closeTime } = workingHours[dayOfWeek];
            const allSlots = generateTimeSlots(openTime, closeTime);

            try {
                // Fetch booked time slots for this date and car
                const bookedSlotsResult = await getBookedTimeSlots(carId, dateString);

                if (bookedSlotsResult.success) {
                    const bookedSlots = bookedSlotsResult.data || [];
                    // Filter out booked time slots
                    const availableSlots = filterAvailableTimeSlots(allSlots, bookedSlots);
                    setAvailableTimeSlots(availableSlots);
                } else {
                    // If there's an error fetching booked slots, show all slots
                    console.warn("Could not fetch booked time slots:", bookedSlotsResult.error);
                    setAvailableTimeSlots(allSlots);
                }
            } catch (error) {
                console.error("Error fetching booked time slots:", error);
                // Fallback to showing all slots if there's an error
                setAvailableTimeSlots(allSlots);
            }
        }
    };

    // Time selection handlers
    const handleStartTimeSelect = (time) => {
        setValue("startTime", time);
        setValue("endTime", "");
    };

    const handleEndTimeSelect = (time) => {
        setValue("endTime", time);
    };

    // Get available end times based on selected start time
    const getAvailableEndTimes = () => {
        if (!watchStartTime || availableTimeSlots.length === 0) return [];

        const startIndex = availableTimeSlots.indexOf(watchStartTime);
        if (startIndex === -1) return [];

        return availableTimeSlots.slice(startIndex + 1);
    };

    // Disable dates that are in the past or when dealership is closed
    const isDateDisabled = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date < today) return true;

        const dayOfWeek = {
            0: "SUNDAY",
            1: "MONDAY",
            2: "TUESDAY",
            3: "WEDNESDAY",
            4: "THURSDAY",
            5: "FRIDAY",
            6: "SATURDAY",
        }[date.getDay()];

        return !workingHours[dayOfWeek]?.isOpen;
    };

    // Form submission handler
    const onSubmit = async (data) => {
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
                toast.error(result.error?.message || "Failed to schedule test drive");
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
        isDateDisabled,
        onSubmit,
    };
};