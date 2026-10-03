"use client";

import { MAX_COMPARE_CARS } from "./utils";
import { useFormatters } from "@/hooks/use-formatters";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
 * Header bar for the compare page: the title over a hairline (the shape of the
 * Browse and Dealerships headers) with the car count, then the controls —
 * highlight differences, print, share, and a two-step "clear all".
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
        <header className="mb-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            {/* ── Title + subtitle ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-h1 font-extrabold">{t("title")}</h1>
                    <span className="rounded-full border border-border bg-field px-2.5 py-0.5 text-micro font-semibold tabular-nums">
                        {/* The noun is pluralised in its own message: the
                            ternary encoded English's two forms, and Arabic has
                            six categories. */}
                        {fmt.number(carCount)} {tNouns("cars", { count: carCount })}
                    </span>
                </div>
                <p className="text-body text-muted-foreground">
                    {t("subtitle", { max: fmt.number(MAX_COMPARE_CARS) })}
                </p>
            </div>

            {/* ── Controls ─────────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2 print:hidden">
                <label className="me-2 flex cursor-pointer select-none items-center gap-2 text-caption font-medium">
                    <Switch
                        checked={highlightDifferences}
                        onCheckedChange={handlers.toggleHighlight}
                        aria-label={t("highlightDifferences")}
                    />
                    <span className="max-sm:sr-only">{t("highlightDifferencesLabel")}</span>
                </label>

                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline-strong"
                                size="icon-control"
                                onClick={handlers.printComparison}
                                aria-label={t("print")}
                            >
                                <Printer className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>{t("print")}</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline-strong"
                                size="icon-control"
                                onClick={handleShare}
                                aria-label={t("share")}
                            >
                                {showCopied ? <Check className="size-4 text-positive" /> : <Share2 className="size-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>{showCopied ? t("linkCopied") : t("share")}</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip open={showClearConfirm}>
                        <TooltipTrigger asChild>
                            <Button
                                variant={showClearConfirm ? "destructive" : "outline-strong"}
                                size="control"
                                onClick={handleClearAll}
                            >
                                <Trash2 className="size-4" />
                                {showClearConfirm ? t("confirmClear") : t("clearAll")}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-destructive text-white">
                            <p>{t("clearHint")}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </header>
    );
};

export default ComparePageHeader;
