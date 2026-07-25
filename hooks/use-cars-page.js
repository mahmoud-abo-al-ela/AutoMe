"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { getCars } from "@/actions/cars-listing";

export const useCarsPage = (initialData = null) => {
    const searchParams = useSearchParams();
    
    const pageFromUrl = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const [page, setPage] = useState(pageFromUrl);
    const [isPageLoading, setIsPageLoading] = useState(false);
    
    const [filters, setFilters] = useState({
        search: undefined,
        make: undefined,
        bodyType: undefined,
        fuelType: undefined,
        transmission: undefined,
        dealership: undefined,
        city: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        sortBy: "newest",
    });
    const filterPanelRef = useRef(null);

    const queryClient = useQueryClient();

    const {
        data: queryData,
        isLoading,
        isFetching,
        error,
    } = useQuery({
        queryKey: queryKeys.cars.list({ ...filters, page }),
        queryFn: () => getCars({ ...filters, page }),
    });

    useEffect(() => {
        if (!isFetching) {
            setIsPageLoading(false);
        }
    }, [isFetching]);

    const loading = isLoading || isFetching || isPageLoading;

    const carsData = queryData || (page === 1 && !filters.search ? initialData : null);

    useEffect(() => {
        const initialFilters = {
            search: searchParams.get("search") || undefined,
            make: searchParams.get("make") || undefined,
            bodyType: searchParams.get("bodyType") || undefined,
            fuelType: searchParams.get("fuelType") || undefined,
            transmission: searchParams.get("transmission") || undefined,
            dealership: searchParams.get("dealership") || undefined,
            city: searchParams.get("city") || undefined,
            minPrice: searchParams.get("minPrice")
                ? Number(searchParams.get("minPrice"))
                : undefined,
            maxPrice: searchParams.get("maxPrice")
                ? Number(searchParams.get("maxPrice"))
                : undefined,
            sortBy: searchParams.get("sortBy") || "newest",
            page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
        };

        setFilters(initialFilters);

        if (initialData) {
            queryClient.setQueryData(
                queryKeys.cars.list({ ...initialFilters, page: initialFilters.page }),
                initialData
            );
        }
    }, []);

    const updateURL = useCallback((updatedFilters, newPage) => {
        const params = new URLSearchParams();

        if (updatedFilters.search) params.set("search", updatedFilters.search);
        if (updatedFilters.make) params.set("make", updatedFilters.make);
        if (updatedFilters.bodyType) params.set("bodyType", updatedFilters.bodyType);
        if (updatedFilters.fuelType) params.set("fuelType", updatedFilters.fuelType);
        if (updatedFilters.transmission) params.set("transmission", updatedFilters.transmission);
        if (updatedFilters.dealership) params.set("dealership", updatedFilters.dealership);
        if (updatedFilters.city) params.set("city", updatedFilters.city);
        if (updatedFilters.minPrice) params.set("minPrice", updatedFilters.minPrice.toString());
        if (updatedFilters.maxPrice) params.set("maxPrice", updatedFilters.maxPrice.toString());
        if (updatedFilters.sortBy && updatedFilters.sortBy !== "newest") {
            params.set("sortBy", updatedFilters.sortBy);
        }
        if (newPage > 1) params.set("page", newPage.toString());

        const queryString = params.toString();
        const url = queryString ? `/cars?${queryString}` : "/cars";
        window.history.replaceState(null, '', url);
    }, []);

    const handleFilterChange = useCallback((newFilters) => {
        setIsPageLoading(true);
        setPage(1);
        const updatedFilters = { ...newFilters, page: 1 };
        setFilters(updatedFilters);
        updateURL(updatedFilters, 1);
    }, [updateURL]);

    const handlePageChange = useCallback((newPage) => {
        setIsPageLoading(true);
        setPage(newPage);
        updateURL(filters, newPage);

        const section = document.getElementById("cars-results-section");
        if (section) {
            section.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
            window.scrollTo({
                top: 300,
                behavior: "smooth",
            });
        }
    }, [filters, updateURL]);

    const resetAllFilters = useCallback(() => {
        const resetFilters = {
            search: undefined,
            make: undefined,
            bodyType: undefined,
            fuelType: undefined,
            transmission: undefined,
            dealership: undefined,
            city: undefined,
            minPrice: undefined,
            maxPrice: undefined,
            sortBy: "newest",
        };

        setIsPageLoading(true);
        setPage(1);
        setFilters(resetFilters);

        if (filterPanelRef.current) {
            filterPanelRef.current.resetFilters();
        }

        window.history.replaceState(null, '', "/cars");
    }, []);

    const clearFilter = useCallback((filterType) => {
        const updatedFilters = { ...filters };

        switch (filterType) {
            case "search":
                updatedFilters.search = undefined;
                break;
            case "make":
                updatedFilters.make = undefined;
                break;
            case "bodyType":
                updatedFilters.bodyType = undefined;
                break;
            case "fuelType":
                updatedFilters.fuelType = undefined;
                break;
            case "transmission":
                updatedFilters.transmission = undefined;
                break;
            case "dealership":
                updatedFilters.dealership = undefined;
                break;
            case "city":
                updatedFilters.city = undefined;
                break;
            case "all":
                resetAllFilters();
                return;
            case "price":
                updatedFilters.minPrice = undefined;
                updatedFilters.maxPrice = undefined;
                break;
            case "sort":
                updatedFilters.sortBy = "newest";
                break;
            default:
                break;
        }

        setIsPageLoading(true);
        setPage(1);
        setFilters(updatedFilters);
        updateURL(updatedFilters, 1);
    }, [filters, resetAllFilters, updateURL]);

    const getActiveFilters = useCallback(() => {
        const filterMap = {
            search: (val) => ({ type: "search", value: val }),
            make: (val) => ({ type: "make", value: val }),
            bodyType: (val) => ({ type: "bodyType", value: val }),
            fuelType: (val) => ({ type: "fuelType", value: val }),
            transmission: (val) => ({ type: "transmission", value: val }),
            dealership: (val) => ({ type: "dealership", value: val }),
            city: (val) => ({ type: "city", value: val }),
        };

        const activeFilters = Object.entries(filters)
            .filter(([key, value]) => value !== undefined && key in filterMap)
            .map(([key, value]) => filterMap[key](value));

        if (filters.minPrice || filters.maxPrice) {
            const priceFilter = [];
            if (filters.minPrice)
                priceFilter.push(`Min: ${filters.minPrice.toLocaleString()}`);
            if (filters.maxPrice)
                priceFilter.push(`Max: ${filters.maxPrice.toLocaleString()}`);
            activeFilters.push({ type: "price", value: priceFilter.join(" - ") });
        }

        if (filters.sortBy && filters.sortBy !== "newest") {
            const sortLabel =
                filters.sortBy === "priceAsc"
                    ? "Price: Low to High"
                    : "Price: High to Low";
            activeFilters.push({ type: "sort", value: sortLabel });
        }

        return activeFilters;
    }, [filters]);

    return {
        cars: carsData?.success ? carsData.data.cars : [],
        pagination: carsData?.success
            ? carsData.data.pagination
            : { total: 0, page: 1, limit: 9, totalPages: 0 },
        loading,
        error,
        filters,
        activeFilters: getActiveFilters(),
        filterPanelRef,
        handlers: {
            handleFilterChange,
            handlePageChange,
            clearFilter,
            resetAllFilters,
        },
    };
};
