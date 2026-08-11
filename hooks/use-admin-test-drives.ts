"use client";
import { logError } from "@/lib/utils/errors";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getTestDrives, updateTestDriveStatus } from "@/actions/test-drive";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { useDebounce } from "@/hooks/use-debounce";

export const useAdminTestDrives = () => {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
    });

    // Debounce search term to avoid too many API calls
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const {
        data: queryData,
        isLoading: loading,
        error,
        refetch: fetchTestDrives,
    } = useQuery({
        queryKey: queryKeys.testDrives.list({
            status: statusFilter,
            search: debouncedSearchTerm,
            page: pagination.page,
            limit: pagination.limit,
        }),
        queryFn: () => getTestDrives({
            status: statusFilter,
            search: debouncedSearchTerm,
            page: pagination.page,
            limit: pagination.limit,
        }),
        placeholderData: keepPreviousData,
    });

    const testDrives = queryData?.success ? queryData.data?.testDrives || [] : [];
    
    // Update pagination state when query data changes
    useEffect(() => {
        if (queryData?.success && queryData.data?.pagination) {
            setPagination((prev) => {
                const newPagination = { ...prev, ...queryData.data.pagination };
                // Only update if something actually changed to avoid infinite loops
                if (prev.totalItems !== newPagination.totalItems || prev.totalPages !== newPagination.totalPages) {
                     return newPagination;
                }
                return prev;
            });
        }
    }, [queryData]);

    // Reset to first page when search term or filter changes
    useEffect(() => {
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, [debouncedSearchTerm, statusFilter]);

    const { mutateAsync: updateStatusFn } = useMutation({
        mutationFn: updateTestDriveStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.testDrives.all });
        },
    });

    const handleStatusChange = useCallback(async (testDriveId: string, newStatus: string) => {
        try {
            const response = await updateStatusFn({
                testDriveId,
                status: newStatus,
            });

            if (response.success) {
                toast.success(`Test drive ${newStatus.toLowerCase()} successfully`);
            } else {
                toast.error(
                    response.error.message || "Failed to update test drive status"
                );
            }
        } catch (error) {
            logError("Error updating test drive status:", error);
            toast.error("An error occurred while updating test drive status");
        }
    }, [updateStatusFn]);

    const handleFilterChange = useCallback((value: string) => {
        setStatusFilter(value);
    }, []);

    const handlePageChange = useCallback((newPage: number) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setSearchTerm("");
        setStatusFilter("all");
    }, []);

    const testDriveStats = useMemo(() => {
        if (!testDrives || !Array.isArray(testDrives))
            return {
                count: 0,
                pendingCount: 0,
                confirmedCount: 0,
                cancelledCount: 0,
            };

        // serializeTestDrive is nullable for callers that may pass nothing; the
        // list query only ever feeds it real rows.
        const rows = testDrives as { status: string }[];

        return {
            count: rows.length,
            pendingCount: rows.filter((td) => td.status === "PENDING").length,
            confirmedCount: rows.filter((td) => td.status === "CONFIRMED").length,
            cancelledCount: rows.filter((td) => td.status === "CANCELLED").length,
        };
    }, [testDrives]);

    return {
        testDrives,
        loading,
        error,
        statusFilter,
        searchTerm,
        pagination,
        testDriveStats,
        handlers: {
            handleStatusChange,
            handleFilterChange,
            handlePageChange,
            handleClearFilters,
            setSearchTerm,
            retry: fetchTestDrives,
            handleRefresh: fetchTestDrives,
        },
    };
};
