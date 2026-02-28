"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";

export default function WorkingHoursHeader() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100"
        >
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-indigo-900 bg-clip-text text-transparent">
                    Working Hours
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    Set your dealership's opening hours
                </p>
            </div>
        </motion.div>
    );
}
