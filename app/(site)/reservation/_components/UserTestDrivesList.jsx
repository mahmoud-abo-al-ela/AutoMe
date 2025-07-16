"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  Car,
  ChevronRight,
  Filter,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import React from "react";

const TestDriveSkeleton = () => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex flex-col sm:flex-row animate-pulse">
        <div className="w-full sm:w-40 h-32 bg-gray-200"></div>
        <div className="p-4 flex-1 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-px bg-gray-200 my-3"></div>
          <div className="flex flex-wrap gap-2">
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

  const formatDate = (date) => {
    try {
      return format(new Date(date), "MMMM d, yyyy");
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid date";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-800 hover:bg-yellow-100 border-yellow-200"
          >
            Pending
          </Badge>
        );
      case "CONFIRMED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-800 hover:bg-green-100 border-green-200"
          >
            Confirmed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-800 hover:bg-red-100 border-red-200"
          >
            Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderFilters = () => (
    <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by car or date..."
            className="pl-10 pr-10 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-shrink-0 w-full md:w-auto">
          <Tabs
            value={statusFilter}
            defaultValue="all"
            className="w-full"
            onValueChange={handleStatusChange}
          >
            <TabsList className="grid grid-cols-4 w-full gap-0.5 sm:gap-1">
              <TabsTrigger
                key="all"
                value="all"
                className="text-xs sm:text-sm px-1 sm:px-3 cursor-pointer"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                key="PENDING"
                value="PENDING"
                className="text-xs sm:text-sm px-1 sm:px-3 cursor-pointer"
              >
                Pending
              </TabsTrigger>
              <TabsTrigger
                key="CONFIRMED"
                value="CONFIRMED"
                className="text-xs sm:text-sm px-1 sm:px-3 cursor-pointer"
              >
                Confirmed
              </TabsTrigger>
              <TabsTrigger
                key="CANCELLED"
                value="CANCELLED"
                className="text-xs sm:text-sm px-1 sm:px-3 cursor-pointer"
              >
                Cancelled
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 min-h-[400px] sm:min-h-[500px] px-2 md:px-0">
      {renderFilters()}
      {loading ? (
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((i) => (
            <TestDriveSkeleton key={i} />
          ))}
        </div>
      ) : !testDrives || testDrives.length === 0 ? (
        <Card className="p-4 sm:p-8 border-dashed border-2">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="bg-gray-100 p-3 sm:p-4 rounded-full mb-3 sm:mb-4">
              <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-gray-500" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">
              No test drives found
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md">
              You haven't scheduled any test drives yet. Find your dream car and
              schedule a test drive today!
            </p>
            <Button
              onClick={() => router.push("/cars")}
              size="sm"
              className="cursor-pointer w-full sm:w-auto"
            >
              Browse Cars
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredDrives.length === 0 && searchQuery ? (
            <Card className="p-4 sm:p-6 text-center">
              <p className="text-sm sm:text-base text-muted-foreground">
                No test drives match your search.
              </p>
              <Button
                variant="link"
                onClick={handleClearSearch}
                className="text-sm sm:text-base"
              >
                Clear search
              </Button>
            </Card>
          ) : (
            filteredDrives.map((testDrive) => (
              <motion.div
                key={testDrive.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="group border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative w-full sm:w-48 h-32 sm:h-36">
                    {testDrive.car?.images &&
                    testDrive.car.images.length > 0 ? (
                      <>
                        <Image
                          src={testDrive.car.images[0]}
                          alt={testDrive.car.title || "Car image"}
                          fill
                          sizes="(max-width: 640px) 100vw, 12rem"
                          style={{ objectFit: "cover" }}
                          className="bg-gray-100 group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-1 right-1 block md:hidden">
                          {getStatusBadge(testDrive.status)}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Car className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex-1">
                    <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg">
                          {testDrive.car?.title || "Unknown Car"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500" />
                            <span>{formatDate(testDrive.date)}</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500" />
                            <span>
                              {testDrive.startTime} - {testDrive.endTime}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-1 sm:mt-0 hidden md:block">
                        {getStatusBadge(testDrive.status)}
                      </div>
                    </div>

                    <Separator className="my-2.5 sm:my-4" />

                    <div className="grid grid-cols-2 gap-2 mt-2 sm:mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer text-xs sm:text-sm"
                        onClick={() => handleViewCar(testDrive.car?.id)}
                        disabled={!testDrive.car?.id}
                      >
                        View Car
                      </Button>
                      <Button
                        size="sm"
                        className="cursor-pointer text-xs sm:text-sm"
                        onClick={() => handleViewDetails(testDrive.id)}
                        disabled={testDrive.status === "CANCELLED"}
                      >
                        {testDrive.status === "CANCELLED"
                          ? "Cancelled"
                          : "Manage"}
                        {testDrive.status === "CANCELLED" ? null : (
                          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {shouldShowPagination() && (
        <div className="flex justify-center mt-6 sm:mt-8 gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => handlePageChange(Math.max(pagination.page - 1, 1))}
            className="cursor-pointer text-xs sm:text-sm px-2 sm:px-3"
          >
            Previous
          </Button>
          <div className="flex items-center gap-1 sm:gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === pagination.totalPages ||
                  (p >= pagination.page - 1 && p <= pagination.page + 1)
              )
              .map((p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) {
                  return (
                    <React.Fragment key={`ellipsis-${p}`}>
                      <span className="px-1 sm:px-2 text-xs sm:text-sm text-muted-foreground">
                        ...
                      </span>
                      <Button
                        key={p}
                        variant={pagination.page === p ? "default" : "outline"}
                        size="icon"
                        className="w-6 h-6 sm:w-8 sm:h-8 cursor-pointer text-xs sm:text-sm"
                        onClick={() => handlePageChange(p)}
                      >
                        {p}
                      </Button>
                    </React.Fragment>
                  );
                }
                return (
                  <Button
                    key={p}
                    variant={pagination.page === p ? "default" : "outline"}
                    size="icon"
                    className="w-6 h-6 sm:w-8 sm:h-8 cursor-pointer text-xs sm:text-sm"
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </Button>
                );
              })}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
            className="cursor-pointer text-xs sm:text-sm px-2 sm:px-3"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserTestDrivesList;
