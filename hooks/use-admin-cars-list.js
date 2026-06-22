"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { getCars, deleteCar, updateCar } from "@/actions/cars";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";

export const useAdminCarsList = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [carToDelete, setCarToDelete] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const queryClient = useQueryClient();
    const debouncedSearch = useDebounce(searchTerm, 500);

    const {
        data: fetchedCars,
        isLoading: isFetchingCars,
        error: fetchCarsError,
        refetch: fetchCarsFn,
    } = useQuery({
        queryKey: queryKeys.cars.list({ search: debouncedSearch, status: statusFilter.toLowerCase(), page: currentPage, pageSize }),
        queryFn: () => getCars(debouncedSearch, statusFilter.toLowerCase(), currentPage, pageSize),
        placeholderData: keepPreviousData,
    });

    const {
        isPending: deleteCarLoading,
        mutateAsync: deleteCarFn,
    } = useMutation({
        mutationFn: deleteCar,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cars.all }),
    });

    const {
        data: updatedCar,
        isPending: updateCarLoading,
        mutateAsync: updateCarFn,
    } = useMutation({
        mutationFn: ({ carId, updates }) => updateCar(carId, updates),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cars.all }),
    });

    const carStats = useMemo(() => {
        const carsData = fetchedCars?.data?.data;
        if (!carsData || !Array.isArray(carsData))
            return {
                count: 0,
                totalCount: 0,
                totalValue: 0,
                availableCount: 0,
                unavailableCount: 0,
                soldCount: 0,
                featuredCount: 0,
                currentPage: 1,
                totalPages: 1,
            };

        const cars = carsData;
        const pagination = fetchedCars.data.pagination || {
            total: cars.length,
            page: 1,
            totalPages: 1,
        };

        return {
            count: cars.length,
            totalCount: pagination.total || 0,
            totalValue: cars.reduce((acc, car) => acc + (car.price || 0), 0),
            availableCount: cars.filter(
                (car) => car.status?.toLowerCase() === "available"
            ).length,
            soldCount: cars.filter((car) => car.status?.toLowerCase() === "sold")
                .length,
            unavailableCount: cars.filter(
                (car) => car.status?.toLowerCase() === "unavailable"
            ).length,
            featuredCount: cars.filter((car) => car.featured).length,
            currentPage: pagination.page || 1,
            totalPages: pagination.totalPages || 1,
        };
    }, [fetchedCars?.data]);

    // Manual refresh function with visual feedback
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await fetchCarsFn();
            toast.success("Data refreshed successfully");
        } catch (error) {
            toast.error("Failed to refresh data");
        } finally {
            setIsRefreshing(false);
        }
    }, [fetchCarsFn]);

    // Delete car handler
    const handleDeleteCar = async (carId) => {
        try {
            const response = await deleteCarFn(carId);
            if (response.success) {
                toast.success("Car deleted successfully", {
                    description: "The car has been removed from your inventory.",
                });
            } else {
                throw new Error(response.error || "Delete operation failed");
            }
        } catch (error) {
            toast.error("Delete operation failed", {
                description:
                    error.message || "Unable to delete the car. Please try again.",
            });
        } finally {
            setDeleteDialogOpen(false);
            setCarToDelete(null);
        }
    };

    // Confirm delete handler
    const confirmDelete = (car) => {
        setCarToDelete(car);
        setDeleteDialogOpen(true);
    };

    // Update car handler
    const handleUpdateCar = async (carId, updates) => {
        try {
            const response = await updateCarFn({ carId, updates });
            if (response.success) {
                toast.success("Car updated successfully", {
                    description: "The car details have been updated.",
                });
            } else {
                throw new Error(response.error || "Update operation failed");
            }
        } catch (error) {
            toast.error("Update operation failed", {
                description:
                    error.message || "Unable to update the car. Please try again.",
            });
        }
    };

    // Clear filters handler
    const handleClearFilters = useCallback(() => {
        setSearchTerm("");
        setStatusFilter("all");
        setCurrentPage(1);
    }, []);

    // Calculate paginated data
    const paginatedCars = useMemo(() => {
        if (!fetchedCars?.data?.data) return [];
        return fetchedCars.data.data;
    }, [fetchedCars?.data]);

    // Pagination handlers
    const handlePageChange = (page) => {
        if (page < 1 || page > carStats.totalPages || page === currentPage) return;
        setCurrentPage(page);
        window.scrollTo(0, 0);
    };

    const handleItemsPerPageChange = (value) => {
        const newPageSize = parseInt(value);
        setPageSize(newPageSize);
        setCurrentPage(1);
    };

    return {
        // State
        searchTerm,
        statusFilter,
        deleteDialogOpen,
        carToDelete,
        isRefreshing,
        currentPage,
        pageSize,

        // Data
        paginatedCars,
        carStats,
        isFetchingCars,
        fetchCarsError,
        deleteCarLoading,
        updateCarLoading,
        updatedCar,

        // Handlers
        handlers: {
            setSearchTerm,
            setStatusFilter,
            setDeleteDialogOpen,
            handleRefresh,
            handleDeleteCar,
            confirmDelete,
            handleUpdateCar,
            handleClearFilters,
            handlePageChange,
            handleItemsPerPageChange,
        },
    };
};
