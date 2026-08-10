"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { getCars, deleteCar, updateCar } from "@/actions/cars";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import type { SerializedCar } from "@/lib/utils/serializers";

/** The car-row fields this list reads. */
type AdminCar = SerializedCar;

type CarUpdates = { status?: string; featured?: boolean };

/** Message from a caught unknown, for the toast descriptions below. */
function messageOf(error: unknown): string | undefined {
    return error instanceof Error ? error.message : undefined;
}

export const useAdminCarsList = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [carToDelete, setCarToDelete] = useState<AdminCar | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const queryClient = useQueryClient();
    const debouncedSearch = useDebounce(searchTerm, 500);

    const {
        data: fetchedCars,
        isLoading,
        isFetching,
        error: fetchCarsError,
        refetch: fetchCarsFn,
    } = useQuery({
        queryKey: queryKeys.cars.list({ search: debouncedSearch, status: statusFilter.toLowerCase(), page: currentPage, pageSize }),
        queryFn: () => getCars(debouncedSearch, statusFilter.toLowerCase(), currentPage, pageSize),
        placeholderData: keepPreviousData,
    });

    const isFetchingCars = isLoading || isFetching;

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
        mutationFn: ({ carId, updates }: { carId: string; updates: CarUpdates }) =>
            updateCar(carId, updates),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.cars.all }),
    });

    // ActionResponse is a discriminated union: narrow on .success before
    // touching .data. Previously this read fetchedCars?.data?.data blind,
    // which silently yielded undefined on the error branch.
    const carsPayload = fetchedCars?.success ? fetchedCars.data : null;

    const carStats = useMemo(() => {
        const carsData = carsPayload?.data;
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

        // serializeCars maps a nullable serializer; the listing query only ever
        // feeds it real rows, so the nulls are not reachable.
        const cars = carsData as AdminCar[];
        const pagination = carsPayload?.pagination || {
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
    }, [carsPayload]);

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
    const handleDeleteCar = async (carId: string) => {
        try {
            const response = await deleteCarFn(carId);
            if (response.success) {
                toast.success("Car deleted successfully", {
                    description: "The car has been removed from your inventory.",
                });
            } else {
                // BUG (surfaced by this conversion, NOT fixed here): `error` is
                // the ErrorResponse object, not a string, so this Error's
                // message stringifies to "[object Object]" and that is what the
                // catch below shows the user. The read should be
                // response.error.message; fixing it is its own PR.
                throw new Error(String(response.error) || "Delete operation failed");
            }
        } catch (error) {
            toast.error("Delete operation failed", {
                description:
                    messageOf(error) || "Unable to delete the car. Please try again.",
            });
        } finally {
            setDeleteDialogOpen(false);
            setCarToDelete(null);
        }
    };

    // Confirm delete handler
    const confirmDelete = (car: AdminCar) => {
        setCarToDelete(car);
        setDeleteDialogOpen(true);
    };

    // Update car handler
    const handleUpdateCar = async (carId: string, updates: CarUpdates) => {
        try {
            const response = await updateCarFn({ carId, updates });
            if (response.success) {
                toast.success("Car updated successfully", {
                    description: "The car details have been updated.",
                });
            } else {
                // Same "[object Object]" defect as in handleDeleteCar above.
                throw new Error(String(response.error) || "Update operation failed");
            }
        } catch (error) {
            toast.error("Update operation failed", {
                description:
                    messageOf(error) || "Unable to update the car. Please try again.",
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
        if (!carsPayload?.data) return [];
        return carsPayload.data;
    }, [carsPayload]);

    // Pagination handlers
    const handlePageChange = (page: number) => {
        if (page < 1 || page > carStats.totalPages || page === currentPage) return;
        setCurrentPage(page);
        window.scrollTo(0, 0);
    };

    const handleItemsPerPageChange = (value: string) => {
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
