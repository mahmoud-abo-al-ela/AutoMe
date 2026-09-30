import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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

/** Seeds the default row per day. Order is irrelevant here — the form decides
 * what the dealer sees, and it runs Saturday to Friday. The labels this list
 * used to carry were never rendered. */
const DAYS: { value: DayOfWeek }[] = [
    { value: "SATURDAY" },
    { value: "SUNDAY" },
    { value: "MONDAY" },
    { value: "TUESDAY" },
    { value: "WEDNESDAY" },
    { value: "THURSDAY" },
    { value: "FRIDAY" },
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
    const t = useTranslations("org.settings.workingHours.toasts");
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
            toast.error(t("incomplete"));
            return;
        }

        try {
            const response = await updateWorkingHoursFn(hoursArray);
            if (response.success) {
                toast.success(t("updated"));
            } else {
                // A returned error response used to fall through silently, so a
                // rejected save looked identical to a successful one.
                toast.error(response.error?.message || t("updateFailed"));
            }
        } catch {
            toast.error(t("updateFailed"));
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
