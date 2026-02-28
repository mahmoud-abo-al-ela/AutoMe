"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

export default function DealershipUrlCard({ slug, siteUrl }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-xl border border-green-200"
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Your dealership URL:</p>
                    <a
                        href={siteUrl}
                        className="font-mono text-lg sm:text-xl font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-2 bg-blue-50 px-4 py-3 rounded-xl transition-all duration-300 hover:bg-blue-100"
                    >
                        auto-me.vercel.app/org/{slug}
                        <ExternalLink className="h-5 w-5" />
                    </a>
                </div>
            </div>
        </motion.div>
    );
}
