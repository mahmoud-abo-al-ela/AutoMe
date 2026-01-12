"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getTestDrives, getTestDriveById } from "@/actions/test-drive";
import useFetch from "@/hooks/use-fetch";

const MODES = {
    LIST: "list",
    CREATE: "create",
    VIEW: "view",
    EDIT: "edit",
};

export const useReservationPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mode, setMode] = useState(MODES.LIST);
    const [selectedTestDrive, setSelectedTestDrive] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("all");

    const carId = searchParams.get("carId");
    const testDriveId = searchParams.get("testDriveId");

    const {
        data,
        loading,
        fn: refreshTestDrives,
    } = useFetch(() => {
        return getTestDrives({ status: statusFilter, page: currentPage, limit: 5 });
    }, true);

    const {
        data: testDriveData,
        loading: loadingTestDrive,
        fn: fetchTestDrive,
    } = useFetch(
        () => (testDriveId ? getTestDriveById(testDriveId) : null),
        Boolean(testDriveId)
    );

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

    useEffect(() => {
        if (testDriveId) {
            fetchTestDrive();
        }
    }, [testDriveId]);

    useEffect(() => {
        if (mode === MODES.LIST) {
            refreshTestDrives();
        }
    }, [currentPage, mode]);

    useEffect(() => {
        if (mode === MODES.LIST) {
            setCurrentPage(1);
            refreshTestDrives();
        }
    }, [statusFilter, mode]);

    useEffect(() => {
        if (testDriveData?.success) {
            setSelectedTestDrive(testDriveData.data);
        } else if (testDriveData && !testDriveData.success) {
            toast.error(testDriveData.error || "Failed to load test drive details");
            router.push("/reservation");
        }
    }, [testDriveData, router]);

    const handleReservationSuccess = useCallback(() => {
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
            await refreshTestDrives();
            if (testDriveId) {
                await fetchTestDrive();
            }
            toast.success("Test drive updated successfully");
        } catch (error) {
            console.error("Error refreshing test drive data:", error);
            toast.error("Failed to refresh test drive data");
        }
    }, [testDriveId, refreshTestDrives, fetchTestDrive]);

    const handleFilterChange = useCallback((newStatus) => {
        setStatusFilter(newStatus);
    }, []);

    const handlePageChange = useCallback((newPage) => {
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
            handleReservationSuccess,
            handleEditClick,
            handleEditCancel,
            handleEditSuccess,
            fetchTestDrive,
        },
    };
};
