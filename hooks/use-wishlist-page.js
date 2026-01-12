"use client";

import { useState, useEffect, useCallback } from "react";
import useFetch from "@/hooks/use-fetch";
import { getWishlist } from "@/actions/cars-listing";

export const useWishlistPage = (limit = 6) => {
    const [currentPage, setCurrentPage] = useState(1);
    const { data, loading, fn, error, setData } = useFetch(getWishlist, true);

    useEffect(() => {
        fn({ page: currentPage, limit });
    }, [currentPage]);

    const handlePageChange = useCallback((newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    const handleWishlistChange = useCallback((removedCarId) => {
        if (data?.success && data.data?.cars) {
            const updatedCars = data.data.cars.filter(
                (car) => car.id !== removedCarId
            );
            const updatedTotal = data.data.pagination.total - 1;
            const updatedTotalPages = Math.ceil(updatedTotal / limit);

            setData({
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
            });

            if (updatedCars.length === 0 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else if (currentPage > updatedTotalPages) {
                setCurrentPage(updatedTotalPages || 1);
            } else {
                fn({ page: currentPage, limit });
            }
        }
    }, [data, currentPage, limit, fn, setData]);

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
            retry: () => fn({ page: 1, limit }),
        },
    };
};
