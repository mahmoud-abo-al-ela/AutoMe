"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { getCarWorkingHours } from "@/actions/test-drive";
import {
    generateAvailableDates,
    toWorkingHours,
    type WorkingHours,
} from "../../_lib/scheduling";

/**
 * Used only when a dealership has no WorkingHours rows at all. Onboarding
 * always writes them, so this covers organizations created before that step
 * existed — without it they would be unbookable rather than merely imprecise.
 */
const FALLBACK_WORKING_HOURS: WorkingHours = {
    MONDAY: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    TUESDAY: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    WEDNESDAY: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    THURSDAY: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    FRIDAY: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    SATURDAY: { isOpen: true, openTime: "10:00", closeTime: "15:00" },
    SUNDAY: { isOpen: false, openTime: "", closeTime: "" },
};

/** What the calendar uses before the dealership's hours have loaded. */
const CLOSED_ALL_WEEK: WorkingHours = {
    MONDAY: { isOpen: false, openTime: "", closeTime: "" },
    TUESDAY: { isOpen: false, openTime: "", closeTime: "" },
    WEDNESDAY: { isOpen: false, openTime: "", closeTime: "" },
    THURSDAY: { isOpen: false, openTime: "", closeTime: "" },
    FRIDAY: { isOpen: false, openTime: "", closeTime: "" },
    SATURDAY: { isOpen: false, openTime: "", closeTime: "" },
    SUNDAY: { isOpen: false, openTime: "", closeTime: "" },
};

/**
 * The selling dealership's opening hours for the car being booked.
 *
 * These used to be a hardcoded Mon–Sat 09:00–17:00 constant behind a simulated
 * fetch, so every dealership was advertised with the same hours and customers
 * could book slots on days the dealership was closed.
 */
export const useWorkingHours = (carId: string | null | undefined) => {
    const { data, isLoading } = useQuery({
        queryKey: queryKeys.testDrives.workingHours(carId ?? ""),
        // Guarded by `enabled`, so this only runs with a real car id.
        queryFn: () => getCarWorkingHours(carId!),
        enabled: !!carId,
    });

    const workingHours = useMemo(() => {
        if (!data?.success) return null;
        return data.data.length > 0
            ? toWorkingHours(data.data)
            : FALLBACK_WORKING_HOURS;
    }, [data]);

    // No dates until the real hours land. The date picker is disabled while
    // this is empty, which is what keeps the form from offering slots against
    // hours it has not loaded yet.
    const availableDates = useMemo(
        () => (workingHours ? generateAvailableDates(workingHours) : []),
        [workingHours]
    );

    return {
        // Closed on every day until the real hours arrive, so there is no
        // window in which the form validates a pick against the wrong hours.
        workingHours: workingHours ?? CLOSED_ALL_WEEK,
        availableDates,
        loading: isLoading,
    };
};

export default useWorkingHours;
