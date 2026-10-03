"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SlugStatus } from "../../_lib/onboarding-types";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "autome.com";

/**
 * Shows the dealership URL being reserved as the user types, with its
 * availability inline.
 *
 * The slug was already generated and checked, but never surfaced — so users
 * learned their address only at the end of onboarding. Naming the URL here is
 * what turns "Dealership Name" from a form field into "this is my site".
 */
export default function SlugPreview({
    slug,
    status,
}: {
    slug: string;
    status: SlugStatus;
}) {
    const t = useTranslations("onboarding.orgDetails.slug");

    if (!slug) return null;

    const tone =
        status === "taken"
            ? "border-destructive/30 bg-destructive-soft"
            : status === "available"
              ? "border-positive/30 bg-positive-soft"
              : "border-border bg-muted";

    return (
        <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border px-3 py-2 ${tone}`}
        >
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t("prefix")}</span>
            <span
                dir="ltr"
                className="font-mono text-sm font-semibold text-foreground break-all"
            >
                {slug}
                <span className="font-normal text-muted-foreground">.{ROOT_DOMAIN}</span>
            </span>

            <AnimatePresence mode="wait">
                {status === "checking" && (
                    <motion.span
                        key="checking"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="ms-auto flex items-center gap-1 text-xs font-medium text-muted-foreground"
                    >
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {t("checking")}
                    </motion.span>
                )}
                {status === "available" && (
                    <motion.span
                        key="available"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="ms-auto flex items-center gap-1 text-xs font-semibold text-positive"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t("available")}
                    </motion.span>
                )}
                {status === "taken" && (
                    <motion.span
                        key="taken"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="ms-auto flex items-center gap-1 text-xs font-semibold text-destructive"
                    >
                        <XCircle className="h-3.5 w-3.5" />
                        {t("taken")}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
