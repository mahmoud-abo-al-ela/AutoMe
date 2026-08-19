"use client";

import React from "react";
import { Car, Search } from "lucide-react";
import CarCard from "@/components/CarCard";
import { Pagination, PaginationInfo } from "@/components/common/Pagination";
import { DealershipInventoryFilters } from "./DealershipInventoryFilters";
import { LoadingGrid } from "@/components/common/LoadingStates";
import type { DealershipInventoryProps } from "../_lib/detail-types";

export const DealershipCarsSection = ({
    cars,
    carCount, // original static total count of dealership cars
    carsLoading,
    carsPagination,
    onPageChange,
    filters,
    onFilterChange,
    availableFilters,
}: DealershipInventoryProps & { carCount?: number }) => {
    const totalCarCount = carCount ?? 0;
    const hasActiveFilters = 
        filters.search || 
        filters.minPrice || 
        filters.maxPrice || 
        filters.bodyType || 
        filters.fuelType || 
        filters.transmission;

    return (
        <div className="space-y-6" id="dealership-cars-section">
            {/* Inline filters bar */}
            {totalCarCount > 0 && (
                <DealershipInventoryFilters
                    filters={filters}
                    onFilterChange={onFilterChange}
                    availableFilters={availableFilters}
                    totalCars={carsPagination.total}
                    isLoading={carsLoading}
                />
            )}

            {/* Loading skeleton */}
            {carsLoading && <LoadingGrid count={6} />}

            {/* Empty state - no cars at all in dealership */}
            {!carsLoading && totalCarCount === 0 && (
                <div className="bg-slate-50/50 rounded-2xl p-12 text-center border border-slate-100">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100/80 mb-4 text-slate-400">
                        <Car className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-slate-900">
                        No cars available
                    </h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        This dealership doesn&apos;t have any cars listed at the
                        moment. Check back later for new inventory.
                    </p>
                </div>
            )}

            {/* Empty state - filters returned no results */}
            {!carsLoading && totalCarCount > 0 && cars.length === 0 && (
                <div className="bg-slate-50/50 rounded-2xl p-12 text-center border border-slate-100">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100/80 mb-4 text-slate-400">
                        <Search className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-slate-900">
                        No matching cars
                    </h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                        Try adjusting your filters or search terms to find what you are looking for.
                    </p>
                    <button
                        onClick={() => onFilterChange({ sortBy: "newest" })}
                        className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/95 rounded-lg shadow-sm cursor-pointer transition-colors"
                    >
                        Reset All Filters
                    </button>
                </div>
            )}

            {/* Car grid */}
            {!carsLoading && cars.length > 0 && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {cars.map((car) => (
                            <CarCard key={car.id} car={car} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {carsPagination.totalPages > 1 && (
                        <div className="mt-8 space-y-4 pt-4 border-t border-slate-100">
                            <Pagination
                                currentPage={carsPagination.page}
                                totalPages={carsPagination.totalPages}
                                onPageChange={onPageChange}
                                disabled={carsLoading}
                            />
                            <PaginationInfo
                                currentPage={carsPagination.page}
                                limit={carsPagination.limit}
                                total={carsPagination.total}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
