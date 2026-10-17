"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useActionError } from "@/hooks/use-action-error";
import { requestTestDrive, getBookedTimeSlots } from "@/actions/test-drive";
import {
    dayOfWeekForDate,
    endTimeOptions,
    filterAvailableTimeSlots,
    filterPastTimeSlots,
    generateTimeSlots,
    makeIsDateDisabled,
    type BookedSlot,
    type DayOfWeek,
    type TestDriveFormValues,
    type WorkingHours,
} from "../../_lib/scheduling";
import { checkBooking, type BookingProblem } from "@/lib/utils/booking-slots";

/** Any hours at all: to ask checkBooking only about the date itself. */
const ANY_HOURS = { isOpen: true, openTime: "00:00", closeTime: "23:59" };

/** Why a date cannot be booked whatever the time — not a date, or outside the booking window. */
function dateProblem(date: string): "invalid" | "outsideWindow" | null {
    const problem = checkBooking({ date, startTime: "00:00", endTime: "00:30" }, ANY_HOURS, []);
    return problem === "invalid" || problem === "outsideWindow" ? problem : null;
}

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
    const actionError = useActionError();

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
    const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
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
    const watchEndTime = watch("endTime");

    /** A day's start times still free and the bookings already on it, without touching the form. */
    const readDay = async (dateString: string) => {
        const dayOfWeek = dayOfWeekForDate(dateString);
        const { openTime, closeTime } = workingHours[dayOfWeek];
        // Opening hours say a 09:00 slot exists; they do not say it is still
        // bookable at 14:00. On any other date this is a no-op.
        const allSlots = filterPastTimeSlots(generateTimeSlots(openTime, closeTime), dateString);
        const result = await getBookedTimeSlots(carId, dateString);
        if (!result.success) throw new Error(result.error.message);
        const booked = result.data || [];
        return { dayOfWeek, booked, freeStartTimes: filterAvailableTimeSlots(allSlots, booked) };
    };

    // Date selection handler
    const handleDateChange = async (date: Date | undefined) => {
        if (!date) return;

        const dateString = format(date, "yyyy-MM-dd");
        const dayOfWeek = dayOfWeekForDate(dateString);

        if (!workingHours[dayOfWeek]?.isOpen) {
            toast.error(t("toasts.closedOnDay"));
            return;
        }

        setValue("date", dateString);
        setSelectedDay(dayOfWeek);
        setCalendarOpen(false);

        setValue("startTime", "");
        setValue("endTime", "");

        try {
            const day = await readDay(dateString);
            setBookedSlots(day.booked);
            setAvailableTimeSlots(day.freeStartTimes);
        } catch (error) {
            // Show every slot rather than none: the server refuses a taken one.
            console.warn("Could not fetch booked time slots:", error);
            const { openTime, closeTime } = workingHours[dayOfWeek];
            setBookedSlots([]);
            setAvailableTimeSlots(filterPastTimeSlots(generateTimeSlots(openTime, closeTime), dateString));
        }
    };

    const prepareBooking = async (booking: {
        date: string;
        startTime: string;
        endTime: string;
        notes?: string;
    }): Promise<BookingProblem | null> => {
        const early = dateProblem(booking.date);
        if (early) return early;
        const hours = workingHours[dayOfWeekForDate(booking.date)];
        if (!hours?.isOpen) return "closed";

        const day = await readDay(booking.date);
        const problem = checkBooking(booking, hours, day.booked);
        if (problem) return problem;

        setValue("date", booking.date);
        setSelectedDay(day.dayOfWeek);
        setBookedSlots(day.booked);
        setAvailableTimeSlots(day.freeStartTimes);
        setCalendarOpen(false);
        setValue("startTime", booking.startTime);
        setValue("endTime", booking.endTime);
        setValue("notes", booking.notes ?? "");
        return null;
    };

    /** A day as an agent asks about it: open or not, its hours, and the start times still free. */
    const checkDay = async (date: string) => {
        const early = dateProblem(date);
        if (early) return { date, bookable: false as const, reason: early };
        const hours = workingHours[dayOfWeekForDate(date)];
        if (!hours?.isOpen) return { date, bookable: false as const, reason: "closed" as const };
        const day = await readDay(date);
        return {
            date,
            bookable: day.freeStartTimes.length > 0,
            opens: hours.openTime,
            closes: hours.closeTime,
            freeStartTimes: day.freeStartTimes,
            booked: day.booked.map(({ startTime, endTime }) => ({ startTime, endTime })),
        };
    };

    const handleStartTimeSelect = (time: string) => {
        if (!time) return;
        setValue("startTime", time);
        setValue("endTime", "");
    };

    const handleEndTimeSelect = (time: string) => {
        if (!time) return;
        setValue("endTime", time);
    };

    // Get available end times based on selected start time
    // Up to the next booking or closing time, never across a booking.
    const getAvailableEndTimes = () => {
        if (!watchStartTime || !selectedDay) return [];
        return endTimeOptions(watchStartTime, workingHours[selectedDay], bookedSlots);
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
                toast.error(actionError(result.error, t("toasts.scheduleFailed")));
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
        watchEndTime,
        submitting,
        selectedDay,
        availableTimeSlots,
        calendarOpen,
        setCalendarOpen,
        handleDateChange,
        prepareBooking,
        checkDay,
        handleStartTimeSelect,
        handleEndTimeSelect,
        getAvailableEndTimes,
        isDateDisabled: makeIsDateDisabled(workingHours),
        onSubmit,
    };
};
