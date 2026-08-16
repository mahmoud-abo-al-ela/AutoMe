"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { getWishlist } from "@/actions/cars-listing";

export const useWishlistPage = (limit = 6) => {
    const [currentPage, setCurrentPage] = useState(1);
    const queryClient = useQueryClient();
    const { data: queryData, isLoading: loading, error, refetch } = useQuery({
        queryKey: queryKeys.wishlist.list({ page: currentPage, limit }),
        queryFn: () => getWishlist({ page: currentPage, limit }),
        placeholderData: keepPreviousData,
    });
    
    const data = queryData || { success: false, data: null };

    const handlePageChange = useCallback((newPage: number) => {
        setCurrentPage(newPage);
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    const handleWishlistChange = useCallback((removedCarId: string) => {
        if (data?.success && data.data?.cars) {
            const updatedCars = data.data.cars.filter(
                (car) => car.id !== removedCarId
            );
            const updatedTotal = data.data.pagination.total - 1;
            const updatedTotalPages = Math.ceil(updatedTotal / limit);

            queryClient.setQueryData(
                queryKeys.wishlist.list({ page: currentPage, limit }),
                {
                    ...data,
                    data: {
                        ...data.data,
                        cars: updatedCars,
                        pagination: {
                            ...data.data.pagination,
                            total: updatedTotal,
                            totalPages: updatedTotalPages,
                        },
                    },
                }
            );

            if (updatedCars.length === 0 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else if (currentPage > updatedTotalPages) {
                setCurrentPage(updatedTotalPages || 1);
            }

            queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
        }
    }, [data, currentPage, limit, queryClient]);

    const emptyPagination = { total: 0, page: 1, limit, totalPages: 0 };

    return {
        cars: data?.success ? data.data?.cars ?? [] : [],
        pagination: data?.success
            ? data.data?.pagination ?? emptyPagination
            : emptyPagination,
        loading,
        // The presenter renders this straight into a <p>. useQuery hands back an
        // Error instance, which React refuses to render as a child — so a failed
        // fetch blew up the error state itself. Surface the message instead.
        error: error ? error.message : null,
        handlers: {
            handlePageChange,
            handleWishlistChange,
            retry: () => refetch(),
        },
    };
};
