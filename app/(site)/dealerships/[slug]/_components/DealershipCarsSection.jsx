"use client";

import { useState, useMemo } from "react";
import { Car, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CarCard from "@/components/CarCard";

export const DealershipCarsSection = ({
    cars,
    carCount,
    carsLoading,
    carsPagination,
    onPageChange,
}) => {
    const [searchQuery, setSearchQuery] = useState("");

    // Client-side filtering on the current page of cars
    const filteredCars = useMemo(() => {
        if (!searchQuery.trim()) return cars;

        const query = searchQuery.toLowerCase().trim();
        return cars.filter((car) => {
            const searchableText = [
                car.make,
                car.model,
                car.year?.toString(),
                car.bodyType,
                car.fuelType,
                car.transmission,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(query);
        });
    }, [cars, searchQuery]);

    // Pagination info
    const startItem =
        (carsPagination.page - 1) * carsPagination.limit + 1;
    const endItem = Math.min(
        carsPagination.page * carsPagination.limit,
        carsPagination.total
    );

    return (
        <div>
            {/* Header with search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold">
                    Available Cars
                    <span className="text-muted-foreground font-normal text-lg ml-2">
                        ({carCount})
                    </span>
                </h2>

                {/* Search bar - only show when there are cars */}
                {carCount > 0 && (
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search cars..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-9 h-9"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Loading skeleton */}
            {carsLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="bg-gray-200 h-48 rounded-xl mb-4" />
                            <div className="bg-gray-200 h-4 w-3/4 rounded mb-2" />
                            <div className="bg-gray-200 h-4 w-1/2 rounded" />
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state - no cars at all */}
            {!carsLoading && cars.length === 0 && (
                <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-100">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                        <Car className="h-8 w-8 text-slate-400" />
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

            {/* Empty state - search returned no results */}
            {!carsLoading &&
                cars.length > 0 &&
                filteredCars.length === 0 &&
                searchQuery && (
                    <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-100">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                            <Search className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-slate-900">
                            No cars match your search
                        </h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                            Try adjusting your search terms or{" "}
                            <button
                                onClick={() => setSearchQuery("")}
                                className="text-primary hover:underline font-medium cursor-pointer"
                            >
                                clear the search
                            </button>{" "}
                            to see all cars.
                        </p>
                    </div>
                )}

            {/* Car grid */}
            {!carsLoading && filteredCars.length > 0 && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                        {filteredCars.map((car) => (
                            <CarCard key={car.id} car={car} />
                        ))}
                    </div>

                    {/* Enhanced Pagination */}
                    {carsPagination.totalPages > 1 && !searchQuery && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                            {/* Page info */}
                            <p className="text-sm text-muted-foreground">
                                Showing{" "}
                                <span className="font-medium text-foreground">
                                    {startItem}-{endItem}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium text-foreground">
                                    {carsPagination.total}
                                </span>{" "}
                                cars
                            </p>

                            {/* Page buttons */}
                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                        onPageChange(carsPagination.page - 1)
                                    }
                                    disabled={
                                        carsPagination.page === 1 || carsLoading
                                    }
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                {Array.from({
                                    length: carsPagination.totalPages,
                                }).map((_, i) => {
                                    const pageNum = i + 1;
                                    const currentPage = carsPagination.page;
                                    const totalPages =
                                        carsPagination.totalPages;

                                    // Show first, last, current, and neighbors
                                    const shouldShow =
                                        pageNum === 1 ||
                                        pageNum === totalPages ||
                                        Math.abs(pageNum - currentPage) <= 1;

                                    // Show ellipsis
                                    const showEllipsisBefore =
                                        pageNum === currentPage - 1 &&
                                        currentPage > 3;
                                    const showEllipsisAfter =
                                        pageNum === currentPage + 1 &&
                                        currentPage < totalPages - 2;

                                    if (!shouldShow) {
                                        if (
                                            pageNum === 2 &&
                                            currentPage > 3
                                        ) {
                                            return (
                                                <span
                                                    key={pageNum}
                                                    className="px-1 text-muted-foreground text-sm"
                                                >
                                                    …
                                                </span>
                                            );
                                        }
                                        if (
                                            pageNum === totalPages - 1 &&
                                            currentPage < totalPages - 2
                                        ) {
                                            return (
                                                <span
                                                    key={pageNum}
                                                    className="px-1 text-muted-foreground text-sm"
                                                >
                                                    …
                                                </span>
                                            );
                                        }
                                        return null;
                                    }

                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={
                                                carsPagination.page === pageNum
                                                    ? "default"
                                                    : "outline"
                                            }
                                            size="icon"
                                            className="h-8 w-8 text-sm"
                                            onClick={() =>
                                                onPageChange(pageNum)
                                            }
                                            disabled={carsLoading}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}

                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                        onPageChange(carsPagination.page + 1)
                                    }
                                    disabled={
                                        carsPagination.page ===
                                        carsPagination.totalPages ||
                                        carsLoading
                                    }
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
