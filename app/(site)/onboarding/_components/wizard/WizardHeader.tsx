"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function WizardHeader() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
        >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                <Sparkles className="h-4 w-4" />
                <span>Quick Setup</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Create Your Dealership
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                Set up your online presence in just a few simple steps
            </p>
        </motion.div>
    );
}
