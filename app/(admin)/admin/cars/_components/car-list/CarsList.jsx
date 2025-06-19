"use client";
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import CarsFilter from "./CarsFilter";
import useFetch from "@/hooks/use-fetch";
import { getCars, deleteCar, updateCar } from "@/actions/cars";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import useDebounce from "./hooks/useDebounce";
import CarStatsDisplay from "./CarStatsDisplay";
import CarTableHeader from "./CarTableHeader";
import CarTableRow from "./CarTableRow";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import TableSkeleton from "./TableSkeleton";
import Pagination from "./Pagination";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import StatusBadge from "./StatusBadge";
import { MoreHorizontal, Star } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CarsList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [carToDelete, setCarToDelete] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const isInitialMount = useRef(true);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const {
    data: fetchedCars,
    loading: isFetchingCars,
    error: fetchCarsError,
    fn: fetchCarsFn,
  } = useFetch(getCars);

  const {
    data: deletedCar,
    loading: deleteCarLoading,
    error: deleteCarError,
    fn: deleteCarFn,
  } = useFetch(deleteCar);

  const {
    data: updatedCar,
    loading: updateCarLoading,
    error: updateCarError,
    fn: updateCarFn,
  } = useFetch(updateCar);

  const carStats = useMemo(() => {
    if (!fetchedCars?.data)
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

    const cars = fetchedCars.data;
    const pagination = fetchedCars.pagination || {
      total: cars.length,
      page: 1,
      totalPages: 1,
    };

    return {
      count: cars.length,
      totalCount: pagination.total || 0,
      totalValue: cars.reduce((acc, car) => acc + car.price, 0),
      availableCount: cars.filter(
        (car) => car.status.toLowerCase() === "available"
      ).length,
      soldCount: cars.filter((car) => car.status.toLowerCase() === "sold")
        .length,
      unavailableCount: cars.filter(
        (car) => car.status.toLowerCase() === "unavailable"
      ).length,
      featuredCount: cars.filter((car) => car.featured).length,
      currentPage: pagination.page || 1,
      totalPages: pagination.totalPages || 1,
    };
  }, [fetchedCars?.data, fetchedCars?.pagination]);

  // Initial fetch on component mount
  useEffect(() => {
    if (isInitialMount.current) {
      fetchCarsFn(
        debouncedSearch,
        statusFilter.toLowerCase(),
        currentPage,
        pageSize
      );
      isInitialMount.current = false;
    }
  }, []);

  // Fetch cars only when search, filter, or pagination changes
  useEffect(() => {
    if (!isInitialMount.current) {
      const timer = setTimeout(() => {
        fetchCarsFn(
          debouncedSearch,
          statusFilter.toLowerCase(),
          currentPage,
          pageSize
        );
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [debouncedSearch, statusFilter, currentPage, pageSize]);

  // Manual refresh function with visual feedback
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchCarsFn(
        debouncedSearch,
        statusFilter.toLowerCase(),
        currentPage,
        pageSize
      );
      toast.success("Data refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  }, [debouncedSearch, statusFilter, currentPage, pageSize, fetchCarsFn]);

  // Delete car handler
  const handleDeleteCar = async (carId) => {
    try {
      const response = await deleteCarFn(carId);
      if (response.success) {
        toast.success("Car deleted successfully", {
          description: "The car has been removed from your inventory.",
        });
        await fetchCarsFn(
          debouncedSearch,
          statusFilter.toLowerCase(),
          currentPage,
          pageSize
        );
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
      const response = await updateCarFn(carId, updates);
      if (response.success) {
        toast.success("Car updated successfully", {
          description: "The car details have been updated.",
        });
        await fetchCarsFn(
          debouncedSearch,
          statusFilter.toLowerCase(),
          currentPage,
          pageSize
        );
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
    setCurrentPage(1); // Reset to first page when clearing filters
  }, []);

  // Calculate paginated data
  const paginatedCars = useMemo(() => {
    if (!fetchedCars?.data) return [];
    return fetchedCars.data;
  }, [fetchedCars?.data]);

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page < 1 || page > carStats.totalPages || page === currentPage) return;
    setCurrentPage(page);
    // Scroll to top when changing page
    window.scrollTo(0, 0);
  };

  const handleItemsPerPageChange = (value) => {
    const newPageSize = parseInt(value);
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return (
    <>
      <Toaster
        position="top-right"
        richColors
        expand={true}
        closeButton={true}
        duration={4000}
      />

      {/* Filter component */}
      <CarsFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        disabled={isFetchingCars || isRefreshing}
      />

      <Card className="shadow-lg border-0 bg-white relative overflow-hidden gap-4 pt-0">
        {/* Card header with stats */}
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b pt-3 px-3 sm:px-6">
          <CarStatsDisplay
            stats={carStats}
            isRefreshing={isRefreshing}
            isLoading={isFetchingCars}
            onRefresh={handleRefresh}
          />
        </CardHeader>

        {/* Card content with table */}
        <CardContent className="p-0 relative">
          {fetchCarsError ? (
            <ErrorState error={fetchCarsError} onRetry={handleRefresh} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <CarTableHeader />
                <TableBody>
                  {isFetchingCars || isRefreshing ? (
                    <TableSkeleton />
                  ) : paginatedCars?.length > 0 ? (
                    paginatedCars.map((car) => {
                      const isCarDisabled =
                        deleteCarLoading || updateCarLoading;
                      const isThisCarUpdating =
                        updateCarLoading && updatedCar?.data?.id === car.id;
                      const isThisCarDeleting =
                        deleteCarLoading && carToDelete?.id === car.id;

                      return (
                        <CarTableRow
                          key={car.id}
                          car={car}
                          isCarDisabled={isCarDisabled}
                          isThisCarUpdating={isThisCarUpdating}
                          isThisCarDeleting={isThisCarDeleting}
                          onUpdateCar={handleUpdateCar}
                          onConfirmDelete={confirmDelete}
                        />
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="p-0">
                        <EmptyState
                          searchTerm={searchTerm}
                          statusFilter={statusFilter}
                          onClearFilters={handleClearFilters}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Card footer with pagination */}
        {fetchedCars?.data?.length > 0 && (
          <CardFooter className="px-3 sm:px-6">
            <Pagination
              currentPage={currentPage}
              totalPages={carStats.totalPages}
              pageSize={pageSize}
              totalCount={carStats.totalCount}
              onPageChange={handlePageChange}
              onPageSizeChange={handleItemsPerPageChange}
              isDisabled={isFetchingCars || isRefreshing}
            />
          </CardFooter>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={setDeleteDialogOpen}
        car={carToDelete}
        onDelete={handleDeleteCar}
        isDeleting={deleteCarLoading}
      />
    </>
  );
};

export default CarsList;
