"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function OrgDetailsFooter({ disabled, hint }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center justify-end gap-4 pt-4"
        >
            {/* A greyed-out button with no explanation makes the user guess
                what is missing. */}
            {disabled && hint && (
                <span className="text-sm text-gray-500">{hint}</span>
            )}
            <Button
                type="submit"
                disabled={disabled}
                data-continue-btn
                className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
                Continue
                <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
        </motion.div>
    );
}
