"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { editTestDrive, getBookedTimeSlots } from "@/actions/test-drive";

const editTestDriveSchema = z.object({
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    notes: z.string().optional(),
});

// Day of week mapping
const DAYS_OF_WEEK = {
    0: "SUNDAY",
    1: "MONDAY",
    2: "TUESDAY",
    3: "WEDNESDAY",
    4: "THURSDAY",
    5: "FRIDAY",
    6: "SATURDAY",
};

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

export const useEditTestDriveForm = ({ testDrive, workingHours, carId, onSuccess }) => {
    const [submitting, setSubmitting] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);
    const [availableDates, setAvailableDates] = useState([]);
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [calendarOpen, setCalendarOpen] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm({
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

    // Generate available dates and initialize time slots
    useEffect(() => {
        const today = new Date();
        const dates = [];

        // Generate next 14 days
        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dayOfWeek = DAYS_OF_WEEK[date.getDay()];

            if (workingHours[dayOfWeek]?.isOpen) {
                dates.push(date);
            }
        }

        setAvailableDates(dates);

        // Initialize time slots for the selected date
        const initializeTimeSlots = async () => {
            if (watchDate) {
                const date = new Date(watchDate);
                const dayOfWeek = DAYS_OF_WEEK[date.getDay()];

                setSelectedDay(dayOfWeek);

                if (workingHours[dayOfWeek]) {
                    const { openTime, closeTime } = workingHours[dayOfWeek];
                    const allSlots = generateTimeSlots(openTime, closeTime);

                    try {
                        // Fetch booked time slots for this date and car
                        const bookedSlotsResult = await getBookedTimeSlots(carId, watchDate);

                        if (bookedSlotsResult.success) {
                            const bookedSlots = bookedSlotsResult.data || [];
                            // Filter out booked time slots, but allow the current test drive's time
                            const filteredBookedSlots = bookedSlots.filter(slot =>
                                !(slot.startTime === testDrive.startTime && slot.endTime === testDrive.endTime)
                            );
                            const availableSlots = filterAvailableTimeSlots(allSlots, filteredBookedSlots);
                            setAvailableTimeSlots(availableSlots);
                        } else {
                            // If there's an error fetching booked slots, show all slots
                            setAvailableTimeSlots(allSlots);
                        }
                    } catch (error) {
                        console.error("Error fetching booked time slots:", error);
                        // Fallback to showing all slots if there's an error
                        setAvailableTimeSlots(allSlots);
                    }
                }
            }
        };

        initializeTimeSlots();
    }, [workingHours, watchDate, carId, testDrive.startTime, testDrive.endTime]);

    // Date selection handler
    const handleDateChange = async (date) => {
        if (!date) return;

        const dateString = format(date, "yyyy-MM-dd");
        const dayOfWeek = DAYS_OF_WEEK[date.getDay()];

        if (!workingHours[dayOfWeek]?.isOpen) {
            toast.error("The dealership is closed on this day");
            return;
        }

        setValue("date", dateString);
        setSelectedDay(dayOfWeek);
        setCalendarOpen(false);

        // Reset time selections
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
                    // Filter out booked time slots, but allow the current test drive's time
                    const filteredBookedSlots = bookedSlots.filter(slot =>
                        !(slot.startTime === testDrive.startTime && slot.endTime === testDrive.endTime)
                    );
                    const availableSlots = filterAvailableTimeSlots(allSlots, filteredBookedSlots);
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

        const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
        return !workingHours[dayOfWeek]?.isOpen;
    };

    // Form submission handler
    const onSubmit = async (data) => {
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
                toast.success("Test drive updated successfully!");
                onSuccess();
            } else {
                toast.error(result.error || "Failed to update test drive");
            }
        } catch (error) {
            console.error("Error updating test drive:", error);
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
    };
};