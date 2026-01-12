"use client";

import { useState } from "react";
import FilterPanel from "./FilterPanel";
import CarCard from "@/components/CarCard";
import { Filter, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Pagination, PaginationInfo } from "@/components/common/Pagination";
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
    const hasActiveFilters = activeFilters.length > 0;

    const handleFilterChange = (newFilters) => {
        handlers.handleFilterChange(newFilters);
        setIsFilterOpen(false);
    };

    return (
        <div className="container mx-auto py-4 px-4 mt-18">
            <h1 className="text-xl sm:text-3xl font-bold mb-6 sm:mb-10">
                Browse Available Cars
            </h1>

            <div className="lg:hidden mb-4">
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            <span>
                                Filters {hasActiveFilters && `(${activeFilters.length})`}
                            </span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="w-[85%] sm:w-[350px] p-0 overflow-y-auto"
                    >
                        <div className="p-4 pb-24">
                            <FilterPanel
                                ref={filterPanelRef}
                                onFilter={handleFilterChange}
                                isLoading={loading}
                                initialFilters={filters}
                            />
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

                    {!loading && !error && cars.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {cars.map((car) => (
                                    <CarCard key={car.id} car={car} />
                                ))}
                            </div>

                            <Pagination
                                currentPage={pagination.page}
                                totalPages={pagination.totalPages}
                                onPageChange={handlers.handlePageChange}
                                disabled={loading}
                            />

                            <PaginationInfo
                                currentPage={pagination.page}
                                limit={pagination.limit}
                                total={pagination.total}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
