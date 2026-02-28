"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FilterPanel from "./FilterPanel";
import CarsHero from "./CarsHero";
import ResultsSummary from "./ResultsSummary";
import CarCard from "@/components/CarCard";
import { Filter, Car, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetHeader,
    SheetTitle,
    SheetClose,
} from "@/components/ui/sheet";
import { Pagination } from "@/components/common/Pagination";
import { ActiveFilters } from "./ActiveFilters";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingGrid } from "@/components/common/LoadingStates";

export const CarsPagePresenter = ({
    cars,
    pagination,
    loading,
    error,
    filters,
    activeFilters,
    filterPanelRef,
    handlers,
}) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [heroSearch, setHeroSearch] = useState(filters.search || "");
    const debounceRef = useRef(null);
    const hasActiveFilters = activeFilters.length > 0;

    // Sync hero search with external filter changes (e.g. clear filter chip)
    useEffect(() => {
        setHeroSearch(filters.search || "");
    }, [filters.search]);

    const handleHeroSearchChange = useCallback(
        (e) => {
            const value = e.target.value;
            setHeroSearch(value);

            // Debounce the filter application
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                handlers.handleFilterChange({
                    ...filters,
                    search: value || undefined,
                });
            }, 400);
        },
        [filters, handlers]
    );

    const handleClearHeroSearch = useCallback(() => {
        setHeroSearch("");
        if (debounceRef.current) clearTimeout(debounceRef.current);
        handlers.handleFilterChange({
            ...filters,
            search: undefined,
        });
    }, [filters, handlers]);

    const handleSortChange = useCallback(
        (value) => {
            handlers.handleFilterChange({
                ...filters,
                sortBy: value,
            });
        },
        [filters, handlers]
    );

    const handleFilterChange = (newFilters) => {
        handlers.handleFilterChange(newFilters);
        setIsFilterOpen(false);
    };

    return (
        <div className="container mx-auto py-4 px-4 mt-18">
            <CarsHero
                searchQuery={heroSearch}
                onSearchChange={handleHeroSearchChange}
                onClearSearch={handleClearHeroSearch}
                totalCount={pagination.total}
            />

            <div className="lg:hidden mb-4">
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            <span>Filters</span>
                            {hasActiveFilters && (
                                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-white text-xs font-medium">
                                    {activeFilters.length}
                                </span>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="w-[85%] sm:w-[350px] p-0 flex flex-col"
                    >
                        {/* Sticky Header */}
                        <SheetHeader className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <SheetTitle className="text-base font-semibold">
                                    Filters
                                </SheetTitle>
                                {hasActiveFilters && (
                                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                        {activeFilters.length}
                                    </span>
                                )}
                            </div>
                            <SheetClose className="rounded-full p-1 hover:bg-muted transition-colors">
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close</span>
                            </SheetClose>
                        </SheetHeader>

                        {/* Scrollable Filter Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <FilterPanel
                                ref={filterPanelRef}
                                onFilter={handleFilterChange}
                                isLoading={loading}
                                initialFilters={filters}
                            />
                        </div>

                        {/* Sticky Footer */}
                        <div className="sticky bottom-0 z-10 bg-white border-t px-4 py-3">
                            <Button
                                className="w-full"
                                onClick={() => setIsFilterOpen(false)}
                            >
                                Show {pagination.total.toLocaleString()} results
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="hidden lg:block w-full lg:w-1/4 lg:sticky lg:top-24 lg:self-start">
                    <FilterPanel
                        ref={filterPanelRef}
                        onFilter={handlers.handleFilterChange}
                        isLoading={loading}
                        initialFilters={filters}
                    />
                </div>

                <div className="w-full lg:w-3/4">
                    <ActiveFilters
                        filters={activeFilters}
                        onClearFilter={handlers.clearFilter}
                    />

                    {!loading && !error && cars.length > 0 && (
                        <ResultsSummary
                            currentPage={pagination.page}
                            limit={pagination.limit}
                            total={pagination.total}
                            sortBy={filters.sortBy || "newest"}
                            onSortChange={handleSortChange}
                            isLoading={loading}
                        />
                    )}

                    {loading && <LoadingGrid count={6} />}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                            <h3 className="text-lg font-semibold text-red-800 mb-2">
                                Error loading cars
                            </h3>
                            <p className="text-red-600">
                                Please try again later or adjust your filters.
                            </p>
                        </div>
                    )}

                    {!loading && !error && cars.length === 0 && (
                        <EmptyState
                            icon={Car}
                            title="No cars found"
                            description="We couldn't find any cars matching your current filters."
                            actionLabel="Reset Filters"
                            onAction={handlers.resetAllFilters}
                        />
                    )}

                    <AnimatePresence mode="wait">
                        {!loading && !error && cars.length > 0 && (
                            <motion.div
                                key={`cars-${pagination.page}-${filters.sortBy}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <motion.div
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        hidden: {},
                                        visible: {
                                            transition: {
                                                staggerChildren: 0.06,
                                            },
                                        },
                                    }}
                                >
                                    {cars.map((car) => (
                                        <motion.div
                                            key={car.id}
                                            variants={{
                                                hidden: { opacity: 0, y: 20 },
                                                visible: {
                                                    opacity: 1,
                                                    y: 0,
                                                    transition: {
                                                        duration: 0.4,
                                                        ease: "easeOut",
                                                    },
                                                },
                                            }}
                                        >
                                            <CarCard car={car} />
                                        </motion.div>
                                    ))}
                                </motion.div>

                                <Pagination
                                    currentPage={pagination.page}
                                    totalPages={pagination.totalPages}
                                    onPageChange={handlers.handlePageChange}
                                    disabled={loading}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
