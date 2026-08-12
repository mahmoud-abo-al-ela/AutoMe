"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Loading from "@/components/Loading";
import { Pagination } from "@/components/common/Pagination";
import { TestDriveTable } from "./TestDriveTable";
import { TestDriveFilters } from "./TestDriveFilters";
import { TestDriveMobileSkeleton } from "./TestDriveMobileSkeleton";
import { TestDriveMobileCard } from "./TestDriveMobileCard";
import { TestDriveStatsDisplay } from "./TestDriveStatsDisplay";
import { EmptyState } from "@/components/common/EmptyState";
import { Calendar } from "lucide-react";
import type { useAdminTestDrives } from "@/hooks/use-admin-test-drives";

/**
 * page.tsx spreads the whole useAdminTestDrives result in here, so the props
 * are that return type rather than a restatement of it.
 */
export type TestDrivesPresenterProps = ReturnType<typeof useAdminTestDrives>;

/** One test-drive row, as the hook exposes it. */
export type AdminTestDrive = NonNullable<
    TestDrivesPresenterProps["testDrives"][number]
>;

/**
 * The car fields these components render.
 *
 * serializeTestDrive comes through lib/repositories/test-drive, which is
 * deliberately still JavaScript, so `car` arrives as `{}`. This states the
 * shape the components actually use rather than leaving every read as unknown.
 */
export type TestDriveCar = {
    id: string;
    title: string | null;
    make: string;
    model: string;
    price: number | string;
    images?: string[] | null;
};

/** Shared by the desktop row and the mobile card, which render the same
 * request with the same status control. */
export type TestDriveItemProps = {
    testDrive: AdminTestDrive;
    onStatusChange: TestDrivesPresenterProps["handlers"]["handleStatusChange"];
    isDisabled?: boolean;
    isUpdating?: boolean;
};

export const TestDrivesPresenter = ({
    testDrives,
    loading,
    error,
    statusFilter,
    searchTerm = "",
    pagination,
    testDriveStats,
    handlers,
}: TestDrivesPresenterProps) => {
    if (loading && testDrives.length === 0) {
        return (
            <div>
                <div className="mb-6 md:mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                                Test Drive Management
                            </h1>
                            <p className="text-gray-600 text-sm md:text-base">
                                Manage test drive requests and appointments
                            </p>
                        </div>
                    </div>
                </div>

                <TestDriveFilters
                    searchTerm=""
                    setSearchTerm={() => { }}
                    statusFilter="all"
                    onFilterChange={() => { }}
                    disabled={true}
                />

                <Card className="shadow-lg border-0 bg-white relative overflow-hidden gap-4 pt-0">
                    <CardHeader className="border-b p-3">
                        <CardTitle className="text-lg sm:text-xl">
                            Test Drive Requests
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Manage test drive requests and appointments
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 relative">
                        {/* Desktop Loading */}
                        <div className="hidden md:flex justify-center items-center min-h-[400px]">
                            <Loading />
                        </div>
                        {/* Mobile Loading */}
                        <div className="md:hidden p-4">
                            <TestDriveMobileSkeleton />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error && testDrives.length === 0) {
        return (
            <div>
                <div className="mb-6 md:mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                                Test Drive Management
                            </h1>
                            <p className="text-gray-600 text-sm md:text-base">
                                Manage test drive requests and appointments
                            </p>
                        </div>
                    </div>
                </div>

                <Card className="shadow-lg border-0 bg-white gap-4 pt-0">
                    <CardHeader className="border-b p-3">
                        <CardTitle className="text-lg sm:text-xl">
                            Test Drive Requests
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Manage test drive requests and appointments
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col justify-center items-center min-h-[400px] p-6">
                        <div className="text-red-500 mb-4 text-center">
                            <p className="text-lg font-semibold mb-2">
                                Error Loading Test Drives
                            </p>
                            <p className="text-sm text-gray-600">{error?.message}</p>
                        </div>
                        <Button onClick={() => handlers.retry()} variant="outline">
                            Try Again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // serializeTestDrive is nullable by signature, so the hook's list is typed
    // with nulls it never actually contains. Dropping them here keeps the row
    // components from having to guard every field.
    const presentTestDrives = testDrives.filter(
        (t): t is AdminTestDrive => t !== null
    );

    return (
        <div>
            <div className="mb-6 md:mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                            Test Drive Management
                        </h1>
                        <p className="text-gray-600 text-sm md:text-base">
                            Manage test drive requests and appointments
                        </p>
                    </div>
                </div>
            </div>

            <TestDriveFilters
                searchTerm={searchTerm}
                setSearchTerm={handlers.setSearchTerm || (() => { })}
                statusFilter={statusFilter}
                onFilterChange={handlers.handleFilterChange}
                disabled={loading}
            />

            <Card className="shadow-lg border-0 bg-white relative overflow-hidden gap-4 pt-0">
                <CardHeader className="border-b p-3">
                    <TestDriveStatsDisplay
                        stats={testDriveStats || {
                            count: 0,
                            pendingCount: 0,
                            confirmedCount: 0,
                            cancelledCount: 0
                        }}
                        isRefreshing={loading && testDrives.length > 0}
                        isLoading={loading}
                        onRefresh={handlers.handleRefresh}
                    />
                </CardHeader>

                <CardContent className="p-0 relative">
                    {testDrives.length === 0 ? (
                        <EmptyState 
                            variant={searchTerm || statusFilter !== "all" ? "filtered" : "standalone"}
                            icon={Calendar}
                            title="No test drive requests found"
                            description={searchTerm || statusFilter !== "all" 
                                ? "Try adjusting your search or filter criteria"
                                : "Test drive requests will appear here when customers book appointments"
                            }
                            onClearFilters={searchTerm || statusFilter !== "all" ? handlers.handleClearFilters : undefined}
                            className="py-16 border-0 shadow-none bg-transparent"
                        />
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <TestDriveTable
                                testDrives={presentTestDrives}
                                onStatusChange={handlers.handleStatusChange}
                                isLoading={loading}
                            />

                            {/* Mobile Card View */}
                            <div className="md:hidden px-2 space-y-4">
                                {presentTestDrives.map((testDrive) => (
                                    <TestDriveMobileCard
                                        key={testDrive.id}
                                        testDrive={testDrive}
                                        onStatusChange={handlers.handleStatusChange}
                                        isDisabled={loading}
                                        isUpdating={false}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>

                {/* BUG FIX: this read pagination.total, which does not exist —
                    the field is totalItems. `undefined > limit` is always
                    false, so the pagination controls have never rendered. */}
                {pagination.totalItems > pagination.limit && (
                    <CardFooter className="px-3 sm:px-6">
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.totalPages}
                            onPageChange={handlers.handlePageChange}
                        />
                    </CardFooter>
                )}
            </Card>
        </div>
    );
};
