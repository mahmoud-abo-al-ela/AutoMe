"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function StepIndicator({ step, index, currentStep }) {
    const StepIcon = step.icon;
    const isCompleted = currentStep > step.id;
    const isCurrent = currentStep === step.id;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className={`flex w-24 shrink-0 flex-col items-center gap-2 sm:w-32 ${isCurrent
                    ? "text-blue-600"
                    : isCompleted
                        ? "text-green-600"
                        : "text-gray-400"
                }`}
        >
            <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`h-12 w-12 sm:h-14 sm:w-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 shadow-md ${isCurrent
                        ? "border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-blue-200"
                        : isCompleted
                            ? "border-green-600 bg-green-600 text-white shadow-green-200"
                            : "border-gray-300 bg-white"
                    }`}
            >
                {isCompleted ? (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 10,
                        }}
                    >
                        <Check className="h-6 w-6 sm:h-7 sm:w-7" />
                    </motion.div>
                ) : (
                    <StepIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                )}
            </motion.div>
            <div className="text-center">
                <span className="text-xs sm:text-sm font-semibold block whitespace-nowrap">
                    {step.name}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-500 block">
                    {step.description}
                </span>
            </div>
        </motion.div>
    );
}
