"use client";

import React from "react";
import CarsFilter from "./CarsFilter";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import CarStatsDisplay from "./CarStatsDisplay";
import CarTableHeader from "./CarTableHeader";
import CarTableRow from "./CarTableRow";
import CarMobileCard from "./CarMobileCard";
import CarMobileSkeleton from "./CarMobileSkeleton";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import TableSkeleton from "./TableSkeleton";
import Pagination from "./Pagination";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

export const CarsListPresenter = ({
    searchTerm,
    statusFilter,
    deleteDialogOpen,
    carToDelete,
    isRefreshing,
    currentPage,
    pageSize,
    paginatedCars,
    carStats,
    isFetchingCars,
    fetchCarsError,
    deleteCarLoading,
    updateCarLoading,
    updatedCar,
    handlers,
}) => {
    return (
        <>
            <Toaster
                position="top-right"
                richColors
                expand={true}
                closeButton={true}
                duration={4000}
            />

            <CarsFilter
                searchTerm={searchTerm}
                setSearchTerm={handlers.setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={handlers.setStatusFilter}
                disabled={isRefreshing}
            />

            <Card className="shadow-lg border-0 bg-white relative overflow-hidden gap-4 pt-0">
                <CardHeader className="border-b p-3">
                    <CarStatsDisplay
                        stats={carStats}
                        isRefreshing={isRefreshing}
                        isLoading={isFetchingCars}
                        onRefresh={handlers.handleRefresh}
                    />
                </CardHeader>

                <CardContent className="p-0 relative">
                    {fetchCarsError ? (
                        <ErrorState error={fetchCarsError} onRetry={handlers.handleRefresh} />
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table className="min-w-[700px]">
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
                                                        onUpdateCar={handlers.handleUpdateCar}
                                                        onConfirmDelete={handlers.confirmDelete}
                                                    />
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="p-0">
                                                    <EmptyState
                                                        searchTerm={searchTerm}
                                                        statusFilter={statusFilter}
                                                        onClearFilters={handlers.handleClearFilters}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden px-2">
                                {isFetchingCars || isRefreshing ? (
                                    <CarMobileSkeleton />
                                ) : paginatedCars?.length > 0 ? (
                                    <div className="space-y-4">
                                        {paginatedCars.map((car) => {
                                            const isCarDisabled =
                                                deleteCarLoading || updateCarLoading;
                                            const isThisCarUpdating =
                                                updateCarLoading && updatedCar?.data?.id === car.id;
                                            const isThisCarDeleting =
                                                deleteCarLoading && carToDelete?.id === car.id;

                                            return (
                                                <CarMobileCard
                                                    key={car.id}
                                                    car={car}
                                                    isCarDisabled={isCarDisabled}
                                                    isThisCarUpdating={isThisCarUpdating}
                                                    isThisCarDeleting={isThisCarDeleting}
                                                    onUpdateCar={handlers.handleUpdateCar}
                                                    onConfirmDelete={handlers.confirmDelete}
                                                />
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <EmptyState
                                        searchTerm={searchTerm}
                                        statusFilter={statusFilter}
                                        onClearFilters={handlers.handleClearFilters}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </CardContent>

                {paginatedCars?.length > 0 && carStats.totalCount > pageSize && (
                    <CardFooter className="px-3 sm:px-6">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={carStats.totalPages}
                            pageSize={pageSize}
                            totalCount={carStats.totalCount}
                            onPageChange={handlers.handlePageChange}
                            onPageSizeChange={handlers.handleItemsPerPageChange}
                            isDisabled={isFetchingCars || isRefreshing}
                        />
                    </CardFooter>
                )}
            </Card>

            <DeleteConfirmationDialog
                isOpen={deleteDialogOpen}
                onClose={handlers.setDeleteDialogOpen}
                car={carToDelete}
                onDelete={handlers.handleDeleteCar}
                isDeleting={deleteCarLoading}
            />
        </>
    );
};
