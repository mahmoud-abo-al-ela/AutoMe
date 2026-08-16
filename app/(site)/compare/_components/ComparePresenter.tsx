"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    return (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen py-20 print:bg-white print:py-4">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pb-10 sm:pb-16 md:pb-20 print:px-2 print:pb-4">
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
                            className="bg-white rounded-xl shadow-md p-8 sm:p-12 text-center"
                        >
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center">
                                    <AlertCircle className="h-7 w-7 text-red-500" />
                                </div>
                                <h2 className="text-lg sm:text-xl font-semibold">
                                    Something went wrong
                                </h2>
                                <p className="text-sm sm:text-base text-muted-foreground max-w-md">
                                    {error}
                                </p>
                                <Button
                                    onClick={handlers.retry}
                                    variant="outline"
                                    className="cursor-pointer mt-2"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Try Again
                                </Button>
                            </div>
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
