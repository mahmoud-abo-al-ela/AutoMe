"use client";

import { MAX_COMPARE_CARS } from "./utils";
import { useFormatters } from "@/hooks/use-formatters";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Printer, Share2, Trash2, Check } from "lucide-react";
import type { CompareHandlers } from "../_lib/compare-types";

/**
 * Header bar for the compare page.
 *
 * Features:
 *  - Gradient text title with car count badge
 *  - "Highlight Differences" toggle switch
 *  - Print & Share buttons
 *  - Clear All button with confirmation tooltip
 *  - Framer-motion entrance animation
 */
const ComparePageHeader = ({
    carCount,
    highlightDifferences,
    handlers,
}: {
    carCount: number;
    highlightDifferences: boolean;
    handlers: CompareHandlers;
}) => {
    const t = useTranslations("compare.header");
    const tNouns = useTranslations("common.pagination.nouns");
    const fmt = useFormatters();
    const [showCopied, setShowCopied] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const handleShare = async () => {
        const result = await handlers.shareComparison();
        if (result?.success && result.method === "clipboard") {
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 2000);
        }
    };

    const handleClearAll = () => {
        if (showClearConfirm) {
            handlers.clearAll();
            setShowClearConfirm(false);
        } else {
            setShowClearConfirm(true);
            setTimeout(() => setShowClearConfirm(false), 3000);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6"
        >
            {/* ── Left: Title + subtitle ──────────────────────────────────────── */}
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-blue-600 bg-clip-text text-transparent print:text-black print:bg-none">
                        {t("title")}
                    </h1>
                    <Badge
                        variant="secondary"
                        className="text-xs font-medium tabular-nums"
                    >
                        {/* The noun is pluralised in its own message: the
                            ternary encoded English's two forms, and Arabic has
                            six categories. */}
                        {fmt.number(carCount)}{" "}
                        {tNouns("cars", { count: carCount })}
                    </Badge>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                    {t("subtitle", { max: MAX_COMPARE_CARS })}
                </p>
            </div>

            {/* ── Right: Controls ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap print:hidden">
                {/* Highlight differences toggle */}
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-muted-foreground">
                                <Switch
                                    checked={highlightDifferences}
                                    onCheckedChange={handlers.toggleHighlight}
                                    aria-label={t("highlightDifferences")}
                                />
                                <span className="hidden sm:inline">{t("highlightDifferencesLabel")}</span>
                            </label>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="sm:hidden">
                            <p>{t("highlightDifferencesLabel")}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Print button */}
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handlers.printComparison}
                                className="cursor-pointer print:hidden"
                                aria-label={t("print")}
                            >
                                <Printer className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>{t("print")}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Share button */}
                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleShare}
                                className="cursor-pointer relative"
                                aria-label={t("share")}
                            >
                                {showCopied ? (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-green-600"
                                    >
                                        <Check className="h-4 w-4" />
                                    </motion.span>
                                ) : (
                                    <Share2 className="h-4 w-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>{showCopied ? t("linkCopied") : t("share")}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Clear All button */}
                <TooltipProvider delayDuration={300}>
                    <Tooltip open={showClearConfirm}>
                        <TooltipTrigger asChild>
                            <Button
                                variant={showClearConfirm ? "destructive" : "outline"}
                                size="sm"
                                onClick={handleClearAll}
                                className="cursor-pointer text-xs sm:text-sm"
                            >
                                <Trash2 className="h-3.5 w-3.5 me-1" />
                                {showClearConfirm ? "Confirm?" : "Clear All"}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent
                            side="bottom"
                            className="bg-destructive text-destructive-foreground"
                        >
                            <p>Click again to remove all cars</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </motion.div>
    );
};

export default ComparePageHeader;
