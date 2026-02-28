"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function SlugStatus({ status, fieldId }) {
    if (fieldId !== "name") return null;

    if (status === "taken") {
        return (
            <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-red-600 flex items-center gap-1"
            >
                <XCircle className="h-4 w-4" />
                This name is already taken. Please choose a different name.
            </motion.p>
        );
    }

    if (status === "available") {
        return (
            <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-green-600 flex items-center gap-1"
            >
                <CheckCircle2 className="h-4 w-4" />
                Great! This name is available.
            </motion.p>
        );
    }

    if (status === "checking") {
        return (
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-blue-600 flex items-center gap-1"
            >
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking availability...
            </motion.p>
        );
    }

    return null;
}
