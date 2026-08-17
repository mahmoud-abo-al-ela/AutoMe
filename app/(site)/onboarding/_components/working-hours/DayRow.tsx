"use client";

import { motion } from "framer-motion";
import { Controller } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "lucide-react";
import TimeInputs from "./TimeInputs";
import type { Control } from "react-hook-form";
import type { WorkingHoursFormValues } from "./useWorkingHours";
import type {
    OnboardingDayHours,
    WorkingHoursDay,
} from "../../_lib/onboarding-types";

export default function DayRow({
    day,
    dayData,
    control,
    index,
}: {
    day: WorkingHoursDay;
    dayData: OnboardingDayHours;
    control: Control<WorkingHoursFormValues>;
    index: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className={`flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 ${dayData.closed
                    ? "bg-gray-50 border-gray-200"
                    : "bg-white border-blue-200"
                }`}
        >
            {/* Day Label */}
            <div className="flex items-center justify-between sm:justify-start sm:w-32">
                <div className="flex items-center gap-2">
                    <div
                        className={`p-2 rounded-lg ${dayData.closed ? "bg-gray-200" : "bg-blue-100"
                            }`}
                    >
                        <Calendar className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                        <span className="font-bold text-lg text-gray-900">
                            {day.label}
                        </span>
                    </div>
                </div>

                {/* Mobile Toggle */}
                <div className="flex items-center gap-2 sm:hidden">
                    <Controller
                        name={`workingHours.${day.key}.closed`}
                        control={control}
                        render={({ field }) => (
                            <Switch
                                checked={!field.value}
                                onCheckedChange={(checked) => field.onChange(!checked)}
                                className="cursor-pointer"
                            />
                        )}
                    />
                    <span
                        className={`text-sm font-semibold px-3 py-1 rounded-full ${dayData.closed
                                ? "bg-gray-200 text-gray-600"
                                : "bg-green-100 text-green-700"
                            }`}
                    >
                        {dayData.closed ? "Closed" : "Open"}
                    </span>
                </div>
            </div>

            {/* Desktop Toggle */}
            <div className="hidden sm:flex items-center gap-3 ml-4">
                <Controller
                    name={`workingHours.${day.key}.closed`}
                    control={control}
                    render={({ field }) => (
                        <Switch
                            checked={!field.value}
                            onCheckedChange={(checked) => field.onChange(!checked)}
                            className="cursor-pointer"
                        />
                    )}
                />
                <span
                    className={`text-sm font-semibold px-4 py-1.5 rounded-full ${dayData.closed
                            ? "bg-gray-200 text-gray-600"
                            : "bg-green-100 text-green-700"
                        }`}
                >
                    {dayData.closed ? "Closed" : "Open"}
                </span>
            </div>

            {/* Time Inputs */}
            {!dayData.closed && <TimeInputs day={day} control={control} />}
        </motion.div>
    );
}
