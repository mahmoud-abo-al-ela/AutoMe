"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Globe } from "lucide-react";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "autome.com";

/**
 * Shows the dealership URL being reserved as the user types, with its
 * availability inline.
 *
 * The slug was already generated and checked, but never surfaced — so users
 * learned their address only at the end of onboarding. Naming the URL here is
 * what turns "Dealership Name" from a form field into "this is my site".
 */
export default function SlugPreview({ slug, status }) {
    if (!slug) return null;

    const tone =
        status === "taken"
            ? "border-red-200 bg-red-50"
            : status === "available"
              ? "border-green-200 bg-green-50"
              : "border-gray-200 bg-gray-50";

    return (
        <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-3 py-2 ${tone}`}
        >
            <Globe className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="text-xs text-gray-500">Your site will be</span>
            <span className="font-mono text-sm font-semibold text-gray-900 break-all">
                {slug}
                <span className="font-normal text-gray-500">.{ROOT_DOMAIN}</span>
            </span>

            <AnimatePresence mode="wait">
                {status === "checking" && (
                    <motion.span
                        key="checking"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="ml-auto flex items-center gap-1 text-xs font-medium text-gray-500"
                    >
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Checking
                    </motion.span>
                )}
                {status === "available" && (
                    <motion.span
                        key="available"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="ml-auto flex items-center gap-1 text-xs font-semibold text-green-700"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Available
                    </motion.span>
                )}
                {status === "taken" && (
                    <motion.span
                        key="taken"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="ml-auto flex items-center gap-1 text-xs font-semibold text-red-700"
                    >
                        <XCircle className="h-3.5 w-3.5" />
                        Taken — try another name
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
