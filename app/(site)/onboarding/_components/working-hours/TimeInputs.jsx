"use client";

import { motion } from "framer-motion";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sun, Moon } from "lucide-react";

export default function TimeInputs({ day, control }) {
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-end gap-4 flex-1"
        >
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                    <Sun className="h-4 w-4 text-blue-600" />
                    <Label
                        htmlFor={`${day.key}-open`}
                        className="text-sm font-semibold text-gray-700 whitespace-nowrap"
                    >
                        Opens
                    </Label>
                </div>
                <Controller
                    name={`workingHours.${day.key}.open`}
                    control={control}
                    render={({ field }) => (
                        <Input
                            id={`${day.key}-open`}
                            type="time"
                            {...field}
                            className="w-full sm:w-36 h-11 text-base border-blue-300 focus:border-blue-500 focus:ring-blue-500/20"
                        />
                    )}
                />
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-lg">
                    <Moon className="h-4 w-4 text-indigo-600" />
                    <Label
                        htmlFor={`${day.key}-close`}
                        className="text-sm font-semibold text-gray-700 whitespace-nowrap"
                    >
                        Closes
                    </Label>
                </div>
                <Controller
                    name={`workingHours.${day.key}.close`}
                    control={control}
                    render={({ field }) => (
                        <Input
                            id={`${day.key}-close`}
                            type="time"
                            {...field}
                            className="w-full sm:w-36 h-11 text-base border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                        />
                    )}
                />
            </div>
        </motion.div>
    );
}
