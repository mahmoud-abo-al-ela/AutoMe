import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { getDealershipInfo, updateWorkingHours } from "@/actions/settings";
import type { DayOfWeek } from "@/lib/generated/prisma";
import type { WorkingHourInput } from "@/lib/repositories/dealership/working-hours";

/** One row of the form. The stored column is `DayOfWeek[]`; the UI edits one day at a time. */
export interface WorkingHourRow {
    dayOfWeek: DayOfWeek;
    openTime: string;
    closeTime: string;
    isOpen: boolean;
}

export type WorkingHoursByDay = Record<DayOfWeek, WorkingHourRow>;

const DAYS: { label: string; value: DayOfWeek }[] = [
    { label: "Monday", value: "MONDAY" },
    { label: "Tuesday", value: "TUESDAY" },
    { label: "Wednesday", value: "WEDNESDAY" },
    { label: "Thursday", value: "THURSDAY" },
    { label: "Friday", value: "FRIDAY" },
    { label: "Saturday", value: "SATURDAY" },
    { label: "Sunday", value: "SUNDAY" },
];

const DEFAULT_WORKING_HOURS = DAYS.reduce((acc, day) => {
    acc[day.value] = {
        dayOfWeek: day.value,
        openTime: "09:00",
        closeTime: "18:00",
        isOpen: day.value !== "SUNDAY",
    };
    return acc;
}, {} as WorkingHoursByDay);

export function useWorkingHours() {
    const [workingHours, setWorkingHours] =
        useState<WorkingHoursByDay>(DEFAULT_WORKING_HOURS);

    const queryClient = useQueryClient();

    const {
        data: dealershipData,
        isLoading: loadingDealershipData,
    } = useQuery({
        queryKey: queryKeys.dashboard.dealership(),
        queryFn: () => getDealershipInfo(),
    });

    const {
        mutateAsync: updateWorkingHoursFn,
        isPending: loadingUpdateWorkingHours,
    } = useMutation({
        mutationFn: (hours: WorkingHourInput[]) => updateWorkingHours(hours),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.dealership() });
        },
    });

    useEffect(() => {
        // The action returns the ActionResponse envelope, so the payload only
        // exists on the success branch.
        if (!dealershipData?.success) return;

        const storedHours = dealershipData.data.workingHours;
        if (!storedHours || storedHours.length === 0) return;

        const formattedHours = {} as WorkingHoursByDay;

        storedHours.forEach((hour) => {
            const day = Array.isArray(hour.dayOfWeek)
                ? hour.dayOfWeek[0]
                : hour.dayOfWeek;

            if (day) {
                formattedHours[day] = {
                    dayOfWeek: day,
                    openTime: hour.openTime || "09:00",
                    closeTime: hour.closeTime || "18:00",
                    isOpen: hour.isOpen ?? false,
                };
            }
        });

        if (Object.keys(formattedHours).length > 0) {
            setWorkingHours(formattedHours);
        }
    }, [dealershipData]);

    const handleDayToggle = (day: DayOfWeek, isOpen: boolean) => {
        setWorkingHours((prev) => ({
            ...prev,
            [day]: { ...prev[day], isOpen },
        }));
    };

    const handleTimeChange = (
        day: DayOfWeek,
        type: "openTime" | "closeTime",
        value: string,
    ) => {
        setWorkingHours((prev) => ({
            ...prev,
            [day]: { ...prev[day], [type]: value },
        }));
    };

    const handleSave = async () => {
        const hoursArray: WorkingHourInput[] = Object.values(workingHours)
            .filter((hour) => hour.dayOfWeek)
            .map((hour) => ({
                dayOfWeek: [hour.dayOfWeek],
                openTime: hour.openTime || "09:00",
                closeTime: hour.closeTime || "18:00",
                isOpen: hour.isOpen ?? false,
            }));

        if (hoursArray.length !== 7) {
            toast.error("Please configure all days of the week");
            return;
        }

        try {
            const response = await updateWorkingHoursFn(hoursArray);
            if (response.success) {
                toast.success("Working hours updated successfully");
            } else {
                // A returned error response used to fall through silently, so a
                // rejected save looked identical to a successful one.
                toast.error(
                    response.error?.message || "Failed to update working hours",
                );
            }
        } catch {
            toast.error("Failed to update working hours");
        }
    };

    return {
        workingHours,
        loadingDealershipData,
        loadingUpdateWorkingHours,
        handleDayToggle,
        handleTimeChange,
        handleSave,
    };
}
