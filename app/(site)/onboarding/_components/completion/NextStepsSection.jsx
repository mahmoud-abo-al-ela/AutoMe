"use client";

import { motion } from "framer-motion";
import { NEXT_STEPS } from "./constants";

export default function NextStepsSection() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100"
        >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                What's Next?
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
                {NEXT_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                            className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:shadow-md"
                        >
                            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md flex-shrink-0">
                                <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
