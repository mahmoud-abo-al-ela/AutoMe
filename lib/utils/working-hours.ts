// Shared working-hours formatting, used by both the dealership listing (for the
// "Open now" badge on cards) and the detail page. Extracted from the detail
// service, which previously read only wh.dayOfWeek[0] and silently dropped the
// other days of a multi-day WorkingHours row (the column is DayOfWeek[]).

import type { DayOfWeek } from "@/lib/generated/prisma";

/** A WorkingHours row, or anything shaped like one. */
export interface WorkingHoursRow {
    dayOfWeek: DayOfWeek[] | DayOfWeek;
    openTime: string;
    closeTime: string;
    isOpen: boolean;
}

export interface WorkingHoursEntry {
    dayKey: DayOfWeek;
    openTime: string;
    closeTime: string;
    isOpen: boolean;
}

// Saturday-first, matching the week the date picker renders (weekStartsOn: 6).
// Egypt's weekend is Friday-Saturday, so a Monday-first list splits it across
// the two ends of the table.
const DAY_ORDER: DayOfWeek[] = [
    "SATURDAY",
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
];

/**
 * Flatten WorkingHours rows into one entry per day, sorted Sat→Fri. A single
 * row may cover several days (dayOfWeek is an array), so every day is emitted.
 */
export function formatWorkingHours(
    workingHours: WorkingHoursRow[] | null | undefined
): WorkingHoursEntry[] {
    if (!workingHours || workingHours.length === 0) {
        return [];
    }

    const entries: WorkingHoursEntry[] = [];
    for (const wh of workingHours) {
        const days = Array.isArray(wh.dayOfWeek) ? wh.dayOfWeek : [wh.dayOfWeek];
        for (const dayKey of days) {
            entries.push({
                dayKey,
                openTime: wh.openTime,
                closeTime: wh.closeTime,
                isOpen: wh.isOpen,
            });
        }
    }

    return entries.sort(
        (a, b) => DAY_ORDER.indexOf(a.dayKey) - DAY_ORDER.indexOf(b.dayKey)
    );
}
