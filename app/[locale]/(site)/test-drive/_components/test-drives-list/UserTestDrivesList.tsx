"use client";
import { useFormatters } from "@/hooks/use-formatters";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import TestDriveSkeleton from "./TestDriveSkeleton";
import TestDriveCard from "./TestDriveCard";
import TestDriveFilters from "./TestDriveFilters";
import { Pagination } from "@/components/common/Pagination";
import TestDriveEmptyState from "./TestDriveEmptyState";
import { useTranslations } from "next-intl";
import type {
  TestDriveListItem,
  TestDrivePagination as PaginationState,
} from "../../_lib/test-drive-types";

const UserTestDrivesList = ({
  testDrives,
  loading,
  pagination,
}: {
  testDrives: TestDriveListItem[];
  loading: boolean;
  pagination: PaginationState | null;
}) => {
  const { date: fmtDate } = useFormatters();
  const t = useTranslations("testDrive.list");
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState(pagination?.status || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDrives, setFilteredDrives] = useState<TestDriveListItem[]>(
    testDrives || []
  );

  // Memoised because the search effect below filters on the *formatted* date,
  // so it is a real dependency: switching locale has to re-filter against the
  // Arabic rendering of the same dates, not the English one it matched before.
  const formatDate = useCallback(
    (date: string) => {
      try {
        return fmtDate(new Date(date), { month: "long" });
      } catch (error) {
        console.error("Date formatting error:", error);
        return t("invalidDate");
      }
    },
    [fmtDate, t]
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
  }, [testDrives, searchQuery, formatDate]);

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

      {pagination && shouldShowPagination() && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default UserTestDrivesList;