"use client";
import { logError } from "@/lib/utils/errors";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getTestDrives, getTestDriveById } from "@/actions/test-drive";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";

const MODES = {
    LIST: "list",
    CREATE: "create",
    VIEW: "view",
    EDIT: "edit",
};

export const useTestDrivePage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mode, setMode] = useState(MODES.LIST);
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("all");

    const carId = searchParams.get("carId");
    const testDriveId = searchParams.get("testDriveId");

    const queryClient = useQueryClient();

    const {
        data,
        isLoading: loading,
        refetch: refreshTestDrives,
    } = useQuery({
        queryKey: queryKeys.testDrives.list({ status: statusFilter, page: currentPage, limit: 5 }),
        queryFn: () => getTestDrives({ status: statusFilter, page: currentPage, limit: 5 }),
        enabled: mode === MODES.LIST,
    });

    const {
        data: testDriveData,
        isLoading: loadingTestDrive,
        refetch: fetchTestDrive,
    } = useQuery({
        queryKey: queryKeys.testDrives.detail(testDriveId ?? ""),
        // Guarded by `enabled` below, so this only runs with a real id.
        queryFn: () => getTestDriveById(testDriveId!),
        enabled: !!testDriveId,
    });

    // Determine mode based on URL params
    useEffect(() => {
        if (testDriveId) {
            setMode(MODES.VIEW);
        } else if (carId) {
            setMode(MODES.CREATE);
        } else {
            setMode(MODES.LIST);
        }
    }, [testDriveId, carId]);

    // Reset pagination when status changes
    useEffect(() => {
        if (mode === MODES.LIST) {
            setCurrentPage(1);
        }
    }, [statusFilter, mode]);

    const selectedTestDrive = testDriveData?.success ? testDriveData.data : null;

    useEffect(() => {
        if (testDriveData && !testDriveData.success) {
            toast.error(
                testDriveData.error.message || "Failed to load test drive details"
            );
            router.push("/test-drive");
        }
    }, [testDriveData, router]);

    const handleTestDriveSuccess = useCallback(() => {
        router.push(`/cars/${carId}`);
    }, [carId, router]);

    const handleEditClick = useCallback(() => {
        setMode(MODES.EDIT);
    }, []);

    const handleEditCancel = useCallback(() => {
        setMode(MODES.VIEW);
    }, []);

    const handleEditSuccess = useCallback(async () => {
        setMode(MODES.VIEW);
        try {
            await queryClient.invalidateQueries({ queryKey: queryKeys.testDrives.all });
            toast.success("Test drive updated successfully");
        } catch (error) {
            logError("Error refreshing test drive data:", error);
            toast.error("Failed to refresh test drive data");
        }
    }, [queryClient]);

    const handleFilterChange = useCallback((newStatus: string) => {
        setStatusFilter(newStatus);
    }, []);

    const handlePageChange = useCallback((newPage: number) => {
        setCurrentPage(newPage);
    }, []);

    const testDrives = data?.success && data.data?.testDrives ? data.data.testDrives : [];
    const pagination = data?.success && data.data?.pagination
        ? {
            ...data.data.pagination,
            status: statusFilter,
            onPageChange: handlePageChange,
            onStatusChange: handleFilterChange,
        }
        : null;

    return {
        mode,
        carId,
        testDriveId,
        selectedTestDrive,
        testDrives,
        pagination,
        loading,
        loadingTestDrive,
        handlers: {
            handleTestDriveSuccess,
            handleEditClick,
            handleEditCancel,
            handleEditSuccess,
            fetchTestDrive,
        },
    };
};
