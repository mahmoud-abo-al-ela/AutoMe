"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SlugStatus } from "../../_lib/onboarding-types";
import { ROOT_DOMAIN } from "@/lib/utils/tenant-host";

/**
 * Shows the dealership URL being reserved as the user types, with its
 * availability inline.
 *
 * The slug was already generated and checked, but never surfaced — so users
 * learned their address only at the end of onboarding. Naming the URL here is
 * what turns "Dealership Name" from a form field into "this is my site".
 *
 * The slug part is editable: it is suggested from the name's Latin letters,
 * and an all-Arabic name suggests nothing, so the dealer types it here.
 */
export default function SlugPreview({
    slug,
    status,
    onChange,
    visible,
}: {
    slug: string;
    status: SlugStatus;
    onChange: (value: string) => void;
    /** Shown once there is a name to build an address for. */
    visible: boolean;
}) {
    const t = useTranslations("onboarding.orgDetails.slug");

    if (!visible) return null;

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
            {/* A host name reads left to right in either language. */}
            <span
                dir="ltr"
                className="flex items-center font-mono text-sm font-semibold text-foreground"
            >
                <input
                    value={slug}
                    onChange={(event) => onChange(event.target.value)}
                    aria-label={t("label")}
                    placeholder="nile-motors"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    // Sized to its content so the domain sits right after it.
                    size={Math.max(slug.length, 11)}
                    className="min-w-0 rounded-sm border-b border-dashed border-muted-foreground/50 bg-transparent px-0.5 font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground/60 focus:border-primary"
                />
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
