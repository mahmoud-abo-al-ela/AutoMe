"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getTestDrives, getTestDriveById } from "@/actions/test-drive";
import Loading from "@/components/Loading";
import {
  ReservationForm,
  InfoSidebar,
  useWorkingHours,
  ExistingReservation,
  EditReservationForm,
  UserTestDrivesList,
} from "./_components";
import { ReservationSkeleton } from "./_components/ExistingReservation";
import useFetch from "@/hooks/use-fetch";

const ReservationPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTestDrive, setSelectedTestDrive] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    workingHours,
    availableDates,
    loading: loadingHours,
    isDateDisabled,
  } = useWorkingHours();

  const carId = searchParams.get("carId");
  const testDriveId = searchParams.get("testDriveId");

  const {
    data,
    loading,
    fn: refreshTestDrives,
  } = useFetch(() => {
    return getTestDrives({ status: statusFilter, page: currentPage, limit: 5 });
  }, true);

  const handleFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
  };

  const {
    data: testDriveData,
    loading: loadingTestDrive,
    fn: fetchTestDrive,
  } = useFetch(
    () => (testDriveId ? getTestDriveById(testDriveId) : null),
    Boolean(testDriveId)
  );

  useEffect(() => {
    if (testDriveId) {
      fetchTestDrive();
    }
  }, [testDriveId]);

  useEffect(() => {
    refreshTestDrives();
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    refreshTestDrives();
  }, [statusFilter]);

  useEffect(() => {
    if (testDriveData?.success) {
      setSelectedTestDrive(testDriveData.data);
    } else if (testDriveData && !testDriveData.success) {
      toast.error(testDriveData.error || "Failed to load test drive details");
      router.push("/reservation");
    }
  }, [testDriveData]);

  const handleReservationSuccess = () => {
    router.push(`/cars/${carId}`);
  };

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleEditCancel = () => {
    setIsEditMode(false);
  };

  const handleEditSuccess = async () => {
    setIsEditMode(false);
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
  };

  const testDrives = data?.success && data.data ? data.data : [];
  const pagination =
    data?.success && data.pagination
      ? {
          ...data.pagination,
          status: statusFilter,
          onPageChange: (newPage) => {
            setCurrentPage(newPage);
          },
          onStatusChange: handleFilterChange,
        }
      : null;

  return (
    <div className="container max-w-4xl mx-auto pt-15 md:pt-20 md:pb-16">
      <div className="flex flex-row items-center ml-2 md:ml-0 mb-4 md:mb-8">
        <h1 className="text-xl md:text-3xl font-bold">
          {testDriveId
            ? isEditMode
              ? "Edit Test Drive"
              : "Test Drive Details"
            : carId
            ? "Schedule Test Drive"
            : "Your Test Drives"}
        </h1>
      </div>

      {testDriveId ? (
        isEditMode ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {loadingTestDrive ? (
                <ReservationSkeleton />
              ) : (
                <EditReservationForm
                  testDrive={selectedTestDrive}
                  onCancel={handleEditCancel}
                  onSuccess={handleEditSuccess}
                  workingHours={workingHours}
                  availableDates={availableDates}
                  isDateDisabled={isDateDisabled}
                />
              )}
            </div>
            <div className="md:col-span-1">
              <InfoSidebar car={selectedTestDrive?.car} />
            </div>
          </div>
        ) : (
          <ExistingReservation
            testDrive={selectedTestDrive}
            onEditClick={handleEditClick}
            refreshData={fetchTestDrive}
            loading={loadingTestDrive}
          />
        )
      ) : carId ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <ReservationForm
              carId={carId}
              onSuccess={handleReservationSuccess}
              workingHours={workingHours}
              availableDates={availableDates}
              isDateDisabled={isDateDisabled}
            />
          </div>
          <div className="md:col-span-1">
            <InfoSidebar carId={carId} />
          </div>
        </div>
      ) : (
        <UserTestDrivesList
          testDrives={testDrives}
          loading={loading}
          pagination={pagination}
          key={`test-drives-list-${currentPage}-${statusFilter}`}
        />
      )}
    </div>
  );
};

export default ReservationPage;
