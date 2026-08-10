"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { DAYS, PRESETS } from "./constants";

/**
 * One-click schedules.
 *
 * Setting hours meant filling seven rows of two time pickers by hand, even
 * though most dealerships keep the same hours every weekday. These cover the
 * common cases; individual days can still be adjusted afterwards.
 */
export default function HoursPresets({ setValue, workingHours }) {
    const applyPreset = (preset) => {
        DAYS.forEach((day) => {
            const next = preset.build(day.key);
            setValue(`workingHours.${day.key}`, next, {
                shouldValidate: true,
                shouldDirty: true,
            });
        });
    };

    const copyMondayToAll = () => {
        const monday = workingHours?.monday;
        if (!monday) return;
        DAYS.filter((d) => d.key !== "monday").forEach((day) => {
            setValue(`workingHours.${day.key}`, { ...monday }, {
                shouldValidate: true,
                shouldDirty: true,
            });
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3"
        >
            <span className="mr-1 flex items-center gap-1.5 text-sm font-semibold text-gray-600">
                <Zap className="h-4 w-4 text-blue-500" />
                Quick fill
            </span>

            {PRESETS.map((preset) => (
                <Button
                    key={preset.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(preset)}
                    className="cursor-pointer bg-white text-xs font-medium"
                >
                    {preset.label}
                </Button>
            ))}

            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyMondayToAll}
                className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700"
            >
                Copy Monday to all days
            </Button>
        </motion.div>
    );
}
