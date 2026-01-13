"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getTestDrives, updateTestDriveStatus } from "@/actions/test-drive";
import { toast } from "sonner";

// Debounce hook
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

export const useAdminTestDrives = () => {
    const [testDrives, setTestDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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

    const fetchTestDrives = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getTestDrives({
                status: statusFilter,
                search: debouncedSearchTerm,
                page: pagination.page,
                limit: pagination.limit,
            });

            if (response.success) {
                setTestDrives(response.data?.testDrives || []);
                setPagination((prev) => ({
                    ...prev,
                    ...response.data?.pagination,
                }));
                setError(null);
            } else {
                setError(response.error);
                toast.error(response.error || "Failed to fetch test drives");
            }
        } catch (error) {
            console.error("Error fetching test drives:", error);
            setError("An error occurred while fetching test drives");
            toast.error("Failed to fetch test drives");
        } finally {
            setLoading(false);
        }
    }, [statusFilter, debouncedSearchTerm, pagination.page, pagination.limit]);

    useEffect(() => {
        fetchTestDrives();
    }, [fetchTestDrives]);

    // Reset to first page when search term or filter changes
    useEffect(() => {
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, [debouncedSearchTerm, statusFilter]);

    const handleStatusChange = useCallback(async (testDriveId, newStatus) => {
        try {
            const response = await updateTestDriveStatus({
                testDriveId,
                status: newStatus,
            });

            if (response.success) {
                toast.success(`Test drive ${newStatus.toLowerCase()} successfully`);
                fetchTestDrives();
            } else {
                toast.error(response.error || "Failed to update test drive status");
            }
        } catch (error) {
            console.error("Error updating test drive status:", error);
            toast.error("An error occurred while updating test drive status");
        }
    }, [fetchTestDrives]);

    const handleFilterChange = useCallback((value) => {
        setStatusFilter(value);
    }, []);

    const handlePageChange = useCallback((newPage) => {
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

        return {
            count: testDrives.length,
            pendingCount: testDrives.filter((td) => td.status === "PENDING").length,
            confirmedCount: testDrives.filter((td) => td.status === "CONFIRMED").length,
            cancelledCount: testDrives.filter((td) => td.status === "CANCELLED").length,
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
