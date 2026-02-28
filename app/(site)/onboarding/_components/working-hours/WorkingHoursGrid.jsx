"use client";

import { motion } from "framer-motion";
import DayRow from "./DayRow";
import { DAYS } from "./constants";

export default function WorkingHoursGrid({ workingHours, control }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
        >
            {DAYS.map((day, index) => {
                const dayData = workingHours[day.key];
                return (
                    <DayRow
                        key={day.key}
                        day={day}
                        dayData={dayData}
                        control={control}
                        index={index}
                    />
                );
            })}
        </motion.div>
    );
}
