"use client";

import { useState, useEffect, useCallback } from "react";
import { getTestDrives, updateTestDriveStatus } from "@/actions/test-drive";
import { toast } from "sonner";

export const useAdminTestDrives = () => {
    const [testDrives, setTestDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("all");
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
    });

    const fetchTestDrives = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getTestDrives({
                status: statusFilter,
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
    }, [statusFilter, pagination.page, pagination.limit]);

    useEffect(() => {
        fetchTestDrives();
    }, [fetchTestDrives]);

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
        setPagination((prev) => ({ ...prev, page: 1 }));
    }, []);

    const handlePageChange = useCallback((newPage) => {
        setPagination((prev) => ({ ...prev, page: newPage }));
    }, []);

    return {
        testDrives,
        loading,
        error,
        statusFilter,
        pagination,
        handlers: {
            handleStatusChange,
            handleFilterChange,
            handlePageChange,
            retry: fetchTestDrives,
        },
    };
};
