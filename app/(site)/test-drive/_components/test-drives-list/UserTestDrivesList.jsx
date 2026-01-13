"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import TestDriveSkeleton from "./TestDriveSkeleton";
import TestDriveCard from "./TestDriveCard";
import TestDriveFilters from "./TestDriveFilters";
import TestDrivePagination from "./TestDrivePagination";
import TestDriveEmptyState from "./TestDriveEmptyState";

const UserTestDrivesList = ({ testDrives, loading, pagination }) => {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState(pagination?.status || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDrives, setFilteredDrives] = useState(testDrives || []);

  const shouldShowPagination = () => {
    if (searchQuery) {
      return filteredDrives.length > 5;
    }
    return pagination && pagination.totalPages > 1;
  };

  useEffect(() => {
    if (pagination?.status && pagination.status !== statusFilter) {
      console.log("Updating local status from pagination:", pagination.status);
      setStatusFilter(pagination.status);
    }
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

  const formatDate = (date) => {
    try {
      return format(new Date(date), "MMMM d, yyyy");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid date";
    }
  };

  const handleViewDetails = (testDriveId) => {
    router.push(`/reservation?testDriveId=${testDriveId}`);
  };

  const handleViewCar = (carId) => {
    router.push(`/cars/${carId}`);
  };

  const handlePageChange = (newPage) => {
    if (pagination && pagination.onPageChange) {
      pagination.onPageChange(newPage);
    }
  };

  const handleStatusChange = (status) => {
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