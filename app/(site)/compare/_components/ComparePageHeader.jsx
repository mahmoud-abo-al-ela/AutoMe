"use client";

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
}) => {
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
                        Car Comparison
                    </h1>
                    <Badge
                        variant="secondary"
                        className="text-xs font-medium tabular-nums"
                    >
                        {carCount} {carCount === 1 ? "car" : "cars"}
                    </Badge>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                    Compare up to 3 cars side by side to help you make the right decision
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
                                    aria-label="Highlight differences"
                                />
                                <span className="hidden sm:inline">Highlight Differences</span>
                            </label>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="sm:hidden">
                            <p>Highlight Differences</p>
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
                                aria-label="Print comparison"
                            >
                                <Printer className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>Print comparison</p>
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
                                aria-label="Share comparison"
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
                            <p>{showCopied ? "Link copied!" : "Share comparison"}</p>
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
                                <Trash2 className="h-3.5 w-3.5 mr-1" />
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
