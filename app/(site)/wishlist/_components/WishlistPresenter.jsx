"use client";

import CarCard from "@/components/CarCard";
import { Heart, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationInfo } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingGrid } from "@/components/common/LoadingStates";
import Link from "next/link";

export const WishlistPresenter = ({
    cars,
    pagination,
    loading,
    error,
    handlers,
}) => {
    const isEmpty = !cars || cars.length === 0;

    return (
        <div className="container py-20 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Heart className="h-7 w-7 text-primary" />
                        <h1 className="text-xl sm:text-3xl font-bold">Your Wishlist</h1>
                        {!loading && !isEmpty && pagination && (
                            <Badge variant="outline" className="ml-2 bg-primary/5">
                                {pagination.total} {pagination.total === 1 ? "car" : "cars"}
                            </Badge>
                        )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Save cars you're interested in and come back to them later.
                    </p>
                </div>
            </div>

            {loading && <LoadingGrid count={6} />}

            {!loading && error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                        Error loading wishlist
                    </h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button
                        onClick={handlers.retry}
                        variant="outline"
                        className="bg-white cursor-pointer"
                    >
                        Try Again
                    </Button>
                </div>
            )}

            {!loading && !error && isEmpty && (
                <EmptyState
                    icon={Heart}
                    title="Your wishlist is empty"
                    description="Browse our inventory and add cars to your wishlist by clicking the heart icon. Come back to compare your options later."
                    actionLabel="Browse Cars"
                    actionHref="/cars"
                />
            )}

            {!loading && !error && !isEmpty && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {cars.map((car) => (
                            <CarCard
                                key={car.id}
                                car={car}
                                onWishlistChange={handlers.handleWishlistChange}
                            />
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
    );
};
