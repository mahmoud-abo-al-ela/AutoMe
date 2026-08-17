"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { DayOfWeek } from "@/lib/generated/prisma";
import type { WorkingHoursByDay } from "./useWorkingHours";

interface WorkingHoursFormProps {
    workingHours: WorkingHoursByDay;
    onDayToggle: (day: DayOfWeek, isOpen: boolean) => void;
    onTimeChange: (
        day: DayOfWeek,
        type: "openTime" | "closeTime",
        value: string,
    ) => void;
}

const DAYS: { label: string; value: DayOfWeek }[] = [
    { label: "Monday", value: "MONDAY" },
    { label: "Tuesday", value: "TUESDAY" },
    { label: "Wednesday", value: "WEDNESDAY" },
    { label: "Thursday", value: "THURSDAY" },
    { label: "Friday", value: "FRIDAY" },
    { label: "Saturday", value: "SATURDAY" },
    { label: "Sunday", value: "SUNDAY" },
];

export default function WorkingHoursForm({
    workingHours,
    onDayToggle,
    onTimeChange,
}: WorkingHoursFormProps) {
    return (
        <div className="space-y-3 sm:space-y-6">
            {DAYS.map((day) => (
                <div
                    key={day.value}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-4 border rounded-lg"
                >
                    <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-0">
                        <Switch
                            checked={workingHours[day.value]?.isOpen || false}
                            onCheckedChange={(isOpen) => {
                                onDayToggle(day.value, isOpen);
                            }}
                            className="cursor-pointer"
                        />
                        <Label className="text-sm sm:text-base font-medium">
                            {day.label}
                        </Label>
                    </div>

                    {workingHours[day.value]?.isOpen ? (
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                            <div className="flex items-center w-full sm:w-auto">
                                <Input
                                    type="time"
                                    value={workingHours[day.value]?.openTime || "09:00"}
                                    onChange={(e) =>
                                        onTimeChange(day.value, "openTime", e.target.value)
                                    }
                                    className="w-full text-xs sm:text-sm h-8 sm:h-10"
                                />
                                <span className="text-gray-500 mx-1 sm:mx-2 whitespace-nowrap text-xs sm:text-sm">
                                    to
                                </span>
                                <Input
                                    type="time"
                                    value={workingHours[day.value]?.closeTime || "18:00"}
                                    onChange={(e) =>
                                        onTimeChange(day.value, "closeTime", e.target.value)
                                    }
                                    className="w-full text-xs sm:text-sm h-8 sm:h-10"
                                />
                            </div>
                        </div>
                    ) : (
                        <span className="text-gray-500 font-medium text-xs sm:text-base">
                            Closed
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}
