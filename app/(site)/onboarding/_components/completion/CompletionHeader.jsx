"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function CompletionHeader() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
            className="text-center"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 10 }}
                className="inline-flex items-center justify-center h-28 w-28 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-2xl shadow-green-300/50"
            >
                <CheckCircle2 className="h-14 w-14 text-white" />
            </motion.div>
        </motion.div>
    );
}
