"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

const DAY_MAP = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
};

/**
 * Parse a time string like "09:00" or "9:00 AM" into minutes since midnight.
 */
function parseTimeToMinutes(timeStr) {
    if (!timeStr) return null;

    const cleaned = timeStr.trim().toUpperCase();

    // Handle "HH:MM AM/PM" format
    const ampmMatch = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (ampmMatch) {
        let hours = parseInt(ampmMatch[1], 10);
        const minutes = parseInt(ampmMatch[2], 10);
        const period = ampmMatch[3];

        if (period === "AM" && hours === 12) hours = 0;
        if (period === "PM" && hours !== 12) hours += 12;

        return hours * 60 + minutes;
    }

    // Handle "HH:MM" 24-hour format
    const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
        const hours = parseInt(match24[1], 10);
        const minutes = parseInt(match24[2], 10);
        return hours * 60 + minutes;
    }

    return null;
}

/**
 * Format minutes since midnight back to a readable time string.
 */
function formatMinutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Calculate the open/closed status based on working hours.
 */
function getOpenStatus(workingHours) {
    if (!workingHours || workingHours.length === 0) {
        return { isOpen: false, message: "Hours not available" };
    }

    const now = new Date();
    const currentDay = DAY_MAP[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Find today's schedule
    const todaySchedule = workingHours.find(
        (wh) => wh.day.toLowerCase() === currentDay.toLowerCase()
    );

    if (!todaySchedule || !todaySchedule.isOpen) {
        // Find next opening day
        const nextOpen = findNextOpenDay(workingHours, now.getDay());
        if (nextOpen) {
            return {
                isOpen: false,
                message: `Opens ${nextOpen.day} at ${nextOpen.time}`,
            };
        }
        return { isOpen: false, message: "Closed" };
    }

    const openMinutes = parseTimeToMinutes(todaySchedule.openTime);
    const closeMinutes = parseTimeToMinutes(todaySchedule.closeTime);

    if (openMinutes === null || closeMinutes === null) {
        return { isOpen: false, message: "Hours not available" };
    }

    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
        return {
            isOpen: true,
            message: `Closes at ${formatMinutesToTime(closeMinutes)}`,
        };
    }

    if (currentMinutes < openMinutes) {
        return {
            isOpen: false,
            message: `Opens at ${formatMinutesToTime(openMinutes)}`,
        };
    }

    // Past closing time, find next opening
    const nextOpen = findNextOpenDay(workingHours, now.getDay());
    if (nextOpen) {
        return {
            isOpen: false,
            message: `Opens ${nextOpen.day} at ${nextOpen.time}`,
        };
    }

    return { isOpen: false, message: "Closed" };
}

/**
 * Find the next day the dealership is open.
 */
function findNextOpenDay(workingHours, currentDayIndex) {
    for (let i = 1; i <= 7; i++) {
        const nextDayIndex = (currentDayIndex + i) % 7;
        const nextDayName = DAY_MAP[nextDayIndex];
        const schedule = workingHours.find(
            (wh) => wh.day.toLowerCase() === nextDayName.toLowerCase()
        );

        if (schedule && schedule.isOpen && schedule.openTime) {
            const dayLabel = i === 1 ? "tomorrow" : nextDayName;
            return {
                day: dayLabel,
                time: schedule.openTime,
            };
        }
    }
    return null;
}

export const OpenStatusBadge = ({ workingHours, className = "" }) => {
    const status = useMemo(() => getOpenStatus(workingHours), [workingHours]);

    return (
        <Badge
            variant="outline"
            className={`gap-1.5 px-2.5 py-1 text-xs font-medium border-0 ${status.isOpen
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                } ${className}`}
        >
            <span
                className={`h-2 w-2 rounded-full ${status.isOpen
                        ? "bg-green-500 animate-pulse"
                        : "bg-red-500"
                    }`}
            />
            <span>{status.isOpen ? "Open Now" : "Closed"}</span>
            <span className="text-[10px] opacity-70">· {status.message}</span>
        </Badge>
    );
};

// Export the utility for reuse
export { getOpenStatus };
