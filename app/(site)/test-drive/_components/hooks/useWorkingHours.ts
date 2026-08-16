"use client";

import { useMemo } from "react";
import {
    generateAvailableDates,
    type WorkingHours,
} from "../../_lib/scheduling";

/**
 * Working hours for the booking calendar.
 *
 * NOTE: these are hardcoded. The dealership's real hours are stored and edited
 * (org settings → working hours, and the onboarding step), but the booking
 * calendar has never read them — every dealership is advertised as open
 * Mon–Sat 09:00–17:00 regardless. Wiring this up is a product decision, not a
 * conversion one; see the handoff.
 */
const defaultWorkingHours: WorkingHours = {
    MONDAY: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    TUESDAY: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    WEDNESDAY: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    THURSDAY: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    FRIDAY: { isOpen: true, openTime: "09:00", closeTime: "17:00" },
    SATURDAY: { isOpen: true, openTime: "10:00", closeTime: "15:00" },
    SUNDAY: { isOpen: false, openTime: "", closeTime: "" },
};

export const useWorkingHours = () => {
    // Recomputed per mount rather than per render: the dates are relative to
    // today, so they are stable for the life of the page.
    const availableDates = useMemo(
        () => generateAvailableDates(defaultWorkingHours),
        []
    );

    return { workingHours: defaultWorkingHours, availableDates };
};

export default useWorkingHours;
