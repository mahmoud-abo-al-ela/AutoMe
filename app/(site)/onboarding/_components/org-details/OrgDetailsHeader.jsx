"use client";

import { motion } from "framer-motion";
import { Building2 } from "lucide-react";

export default function OrgDetailsHeader() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100"
        >
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                    Organization Details
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    Tell us about your dealership
                </p>
            </div>
        </motion.div>
    );
}
