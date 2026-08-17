"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import TestDriveSkeleton from "./TestDriveSkeleton";
import TestDriveCard from "./TestDriveCard";
import TestDriveFilters from "./TestDriveFilters";
import TestDrivePagination from "./TestDrivePagination";
import TestDriveEmptyState from "./TestDriveEmptyState";
import type {
  TestDriveListItem,
  TestDrivePagination as Pagination,
} from "../../_lib/test-drive-types";

const UserTestDrivesList = ({
  testDrives,
  loading,
  pagination,
}: {
  testDrives: TestDriveListItem[];
  loading: boolean;
  pagination: Pagination | null;
}) => {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState(pagination?.status || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDrives, setFilteredDrives] = useState<TestDriveListItem[]>(
    testDrives || []
  );

  const shouldShowPagination = () => {
    if (searchQuery) {
      return filteredDrives.length > 5;
    }
    return pagination && pagination.totalPages > 1;
  };

  useEffect(() => {
    if (pagination?.status && pagination.status !== statusFilter) {
      setStatusFilter(pagination.status);
    }
    // `statusFilter` is read only as a guard. Adding it would re-run the effect
    // on every local change and push the value straight back to the prop's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination?.status]);

  useEffect(() => {
    if (!testDrives) {
      setFilteredDrives([]);
      return;
    }

    if (!searchQuery.trim()) {
      setFilteredDrives(testDrives);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = testDrives.filter(
      (drive) =>
        (drive.car?.title || "").toLowerCase().includes(query) ||
        formatDate(drive.date).toLowerCase().includes(query)
    );
    setFilteredDrives(filtered);
  }, [testDrives, searchQuery]);

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "MMMM d, yyyy");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid date";
    }
  };

  const handleViewDetails = (testDriveId: string) => {
    router.push(`/test-drive?testDriveId=${testDriveId}`);
  };

  const handleViewCar = (carId: string) => {
    router.push(`/cars/${carId}`);
  };

  const handlePageChange = (newPage: number) => {
    if (pagination && pagination.onPageChange) {
      pagination.onPageChange(newPage);
    }
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    if (pagination && pagination.onStatusChange) {
      pagination.onStatusChange(status);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 md:px-0">
      <TestDriveFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        onClearSearch={handleClearSearch}
      />

      {loading ? (
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((i) => (
            <TestDriveSkeleton key={i} />
          ))}
        </div>
      ) : !testDrives || testDrives.length === 0 ? (
        <TestDriveEmptyState
          searchQuery={searchQuery}
          onClearSearch={handleClearSearch}
        />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredDrives.length === 0 && searchQuery ? (
            <TestDriveEmptyState
              searchQuery={searchQuery}
              onClearSearch={handleClearSearch}
            />
          ) : (
            filteredDrives.map((testDrive) => (
              <TestDriveCard
                key={testDrive.id}
                testDrive={testDrive}
                onViewDetails={handleViewDetails}
                onViewCar={handleViewCar}
              />
            ))
          )}
        </div>
      )}

      {shouldShowPagination() && (
        <TestDrivePagination
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default UserTestDrivesList;