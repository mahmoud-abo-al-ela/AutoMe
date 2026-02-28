"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export default function ProgressBar({ currentStep, totalSteps, progress }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
        >
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-700">
                        Step {currentStep} of {totalSteps}
                    </span>
                    <span className="text-sm font-bold text-blue-600">
                        {Math.round(progress)}% Complete
                    </span>
                </div>
                <Progress value={progress} className="h-3" />
            </div>
        </motion.div>
    );
}
