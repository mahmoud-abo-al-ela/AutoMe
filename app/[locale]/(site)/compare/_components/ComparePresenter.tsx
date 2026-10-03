"use client";

import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { SiteEmptyState } from "@/components/brand";
import EmptyCompare from "./EmptyCompare";
import CompareTable from "./CompareTable";
import MobileCompareTable from "./MobileCompareTable";
import ComparePageHeader from "./ComparePageHeader";
import ComparePageSkeleton from "./ComparePageSkeleton";
import type { ComparePageData } from "../_lib/compare-types";

export const ComparePresenter = ({
    cars,
    loading,
    error,
    hasCars,
    singleCar,
    highlightDifferences,
    activeCategory,
    differences,
    winners,
    handlers,
}: ComparePageData) => {
    const tCommon = useTranslations("common");
    return (
        <div className="min-h-[60vh] pb-16 pt-6 sm:pt-8 print:bg-card print:py-4">
            <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 xl:px-0 print:px-2">
                <AnimatePresence mode="wait">
                    {loading ? (
                        /* ── Loading skeleton ──────────────────────────────── */
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ComparePageSkeleton />
                        </motion.div>
                    ) : error ? (
                        /* ── Error state ───────────────────────────────────── */
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }}
                        >
                            <SiteEmptyState
                                icon={AlertCircle}
                                title={tCommon("states.error")}
                                description={error}
                                primary={{ label: tCommon("actions.retry"), onClick: handlers.retry }}
                            />
                        </motion.div>
                    ) : !hasCars ? (
                        /* ── Empty / single-car state ──────────────────────── */
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }}
                        >
                            <EmptyCompare singleCar={singleCar} />
                        </motion.div>
                    ) : (
                        /* ── Comparison view ───────────────────────────────── */
                        <motion.div
                            key="compare"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Header with controls */}
                            <ComparePageHeader
                                carCount={cars.length}
                                highlightDifferences={highlightDifferences}
                                handlers={handlers}
                            />

                            {/* Desktop table */}
                            <div className="hidden md:block print:block">
                                <CompareTable
                                    cars={cars}
                                    highlightDifferences={highlightDifferences}
                                    activeCategory={activeCategory}
                                    differences={differences}
                                    winners={winners}
                                    handlers={handlers}
                                />
                            </div>

                            {/* Mobile table */}
                            <div className="md:hidden print:hidden">
                                <MobileCompareTable
                                    cars={cars}
                                    highlightDifferences={highlightDifferences}
                                    differences={differences}
                                    winners={winners}
                                    handlers={handlers}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
