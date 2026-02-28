"use client";

import { motion } from "framer-motion";
import { Check, X, Car, Shield, Star, Zap } from "lucide-react";
import { getFeatures } from "./utils";

export function PlanFeatureList({ plan }) {
    const features = getFeatures(plan);

    return (
        <ul className="space-y-3">
            {features.map((feature, i) => (
                <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="flex items-start gap-3 text-sm"
                >
                    {feature.included ? (
                        <div className="p-1 bg-green-100 rounded-full">
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        </div>
                    ) : (
                        <div className="p-1 bg-gray-100 rounded-full">
                            <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        </div>
                    )}
                    <span
                        className={
                            feature.included
                                ? "text-gray-800 font-medium"
                                : "text-gray-500"
                        }
                    >
                        {feature.name}
                    </span>
                </motion.li>
            ))}
        </ul>
    );
}
