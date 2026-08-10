"use client";

import { useState, useEffect, useCallback } from "react";
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

    return {
        cars: data?.success ? data.data?.cars : [],
        pagination: data?.success
            ? data.data?.pagination
            : { total: 0, page: 1, limit, totalPages: 0 },
        loading,
        error,
        handlers: {
            handlePageChange,
            handleWishlistChange,
            retry: () => refetch(),
        },
    };
};
