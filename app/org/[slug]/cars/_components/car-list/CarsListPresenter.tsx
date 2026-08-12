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
import type { useAdminCarsList } from "@/hooks/use-admin-cars-list";

/**
 * CarsList spreads the whole useAdminCarsList result into this component, so
 * the props are that return type rather than a restatement of it — adding a
 * field to the hook cannot drift from what the presenter accepts.
 */
export type CarsListPresenterProps = ReturnType<typeof useAdminCarsList>;

/** One row of the admin car table, with the nullable-by-signature case removed. */
export type AdminCarRow = NonNullable<
    CarsListPresenterProps["paginatedCars"][number]
>;

/** Shared by the desktop table row and the mobile card, which render the same
 * car with the same two actions. Handler types come from the hook so they
 * cannot drift from what is actually passed. */
export type CarRowProps = {
    car: AdminCarRow;
    isCarDisabled: boolean;
    isThisCarUpdating: boolean;
    isThisCarDeleting: boolean;
    onUpdateCar: CarsListPresenterProps["handlers"]["handleUpdateCar"];
    onConfirmDelete: CarsListPresenterProps["handlers"]["confirmDelete"];
};

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
}: CarsListPresenterProps) => {
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
                                            paginatedCars.map((row) => {
                                                // serializeCar is declared nullable for callers that
                                                // may hand it nothing; rows from the list query are
                                                // always present.
                                                const car = row!;
                                                const isCarDisabled =
                                                    deleteCarLoading || updateCarLoading;
                                                const isThisCarUpdating =
                                                    updateCarLoading &&
                                                    updatedCar?.success === true &&
                                                    updatedCar.data?.id === car.id;
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
                                        {paginatedCars.map((row) => {
                                            // See the table branch above: nullable by signature only.
                                            const car = row!;
                                            const isCarDisabled =
                                                deleteCarLoading || updateCarLoading;
                                            const isThisCarUpdating =
                                                updateCarLoading &&
                                                updatedCar?.success === true &&
                                                updatedCar.data?.id === car.id;
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
