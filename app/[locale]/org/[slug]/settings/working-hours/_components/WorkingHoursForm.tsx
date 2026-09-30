"use client";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import TimeInput from "@/components/common/TimeInput";
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

/**
 * Row order only, and the key each day's name is read by.
 *
 * Saturday-first, matching the onboarding wizard, `lib/utils/working-hours`
 * and the date picker's `weekStartsOn`. These rows used to run Monday to
 * Sunday, which put the Egyptian weekend in the middle of the list.
 *
 * The names come from `onboarding.workingHours.days` rather than a second copy
 * — the dealer sets these hours once during onboarding and edits them here.
 */
const DAYS: { key: string; value: DayOfWeek }[] = [
    { key: "saturday", value: "SATURDAY" },
    { key: "sunday", value: "SUNDAY" },
    { key: "monday", value: "MONDAY" },
    { key: "tuesday", value: "TUESDAY" },
    { key: "wednesday", value: "WEDNESDAY" },
    { key: "thursday", value: "THURSDAY" },
    { key: "friday", value: "FRIDAY" },
];

export default function WorkingHoursForm({
    workingHours,
    onDayToggle,
    onTimeChange,
}: WorkingHoursFormProps) {
    const t = useTranslations("org.settings.workingHours");
    const tDays = useTranslations("onboarding.workingHours.days");

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
                            aria-label={tDays(day.key)}
                        />
                        <Label className="text-sm sm:text-base font-medium">
                            {tDays(day.key)}
                        </Label>
                    </div>

                    {workingHours[day.value]?.isOpen ? (
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                            <div className="flex items-center w-full sm:w-auto">
                                {/* TimeInput, not a bare <input type="time">: the
                                    native control renders its AM/PM from the
                                    browser's language, not the page's. */}
                                <TimeInput
                                    value={workingHours[day.value]?.openTime || "09:00"}
                                    onChange={(value) =>
                                        onTimeChange(day.value, "openTime", value)
                                    }
                                    className="w-full text-xs sm:text-sm h-8 sm:h-10"
                                />
                                <span className="text-gray-500 mx-1 sm:mx-2 whitespace-nowrap text-xs sm:text-sm">
                                    {t("to")}
                                </span>
                                <TimeInput
                                    value={workingHours[day.value]?.closeTime || "18:00"}
                                    onChange={(value) =>
                                        onTimeChange(day.value, "closeTime", value)
                                    }
                                    className="w-full text-xs sm:text-sm h-8 sm:h-10"
                                />
                            </div>
                        </div>
                    ) : (
                        <span className="text-gray-500 font-medium text-xs sm:text-base">
                            {t("closed")}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}
