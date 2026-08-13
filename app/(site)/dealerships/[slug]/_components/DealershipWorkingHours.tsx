"use client";

import { useMemo } from "react";
import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getOpenStatus } from "./OpenStatusBadge";
import type { WorkingHoursEntry } from "@/lib/utils/working-hours";

const DAY_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

export const DealershipWorkingHours = ({
    workingHours,
}: {
    workingHours?: WorkingHoursEntry[] | null;
}) => {
    const currentDay = useMemo(() => {
        return DAY_NAMES[new Date().getDay()];
    }, []);

    const openStatus = useMemo(
        () => getOpenStatus(workingHours),
        [workingHours]
    );

    if (!workingHours || workingHours.length === 0) {
        return null;
    }

    return (
        <Card className="border-slate-100 shadow-sm">
            <CardContent className="p-6">
                {/* Header with open/closed status */}
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="h-5 w-5 text-slate-500" />
                        Working Hours
                    </h3>
                    <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${openStatus.isOpen
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                    >
                        <span
                            className={`h-2 w-2 rounded-full ${openStatus.isOpen
                                    ? "bg-green-500 animate-pulse"
                                    : "bg-red-500"
                                }`}
                        />
                        {openStatus.isOpen ? "Open Now" : "Closed"}
                        <span className="opacity-70">
                            · {openStatus.message}
                        </span>
                    </div>
                </div>

                {/* Working hours list */}
                <div className="space-y-1">
                    {workingHours.map((wh, index) => {
                        const isToday =
                            wh.day.toLowerCase() === currentDay.toLowerCase();

                        return (
                            <div
                                key={index}
                                className={`flex justify-between items-center text-sm px-3 py-2.5 rounded-lg transition-colors ${isToday
                                        ? "bg-primary/5 border border-primary/10 font-medium"
                                        : "hover:bg-slate-50"
                                    }`}
                            >
                                <span
                                    className={`flex items-center gap-2 ${isToday
                                            ? "text-primary font-semibold"
                                            : "font-medium text-slate-700"
                                        }`}
                                >
                                    {isToday && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    )}
                                    {wh.day}
                                    {isToday && (
                                        <span className="text-[10px] uppercase tracking-wider text-primary/70 font-semibold">
                                            Today
                                        </span>
                                    )}
                                </span>
                                <span
                                    className={
                                        wh.isOpen
                                            ? isToday
                                                ? "text-primary font-semibold"
                                                : "text-green-600"
                                            : "text-red-500"
                                    }
                                >
                                    {wh.isOpen
                                        ? `${wh.openTime} - ${wh.closeTime}`
                                        : "Closed"}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
