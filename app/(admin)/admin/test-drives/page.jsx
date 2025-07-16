"use client";

import { useState, useEffect } from "react";
import { getTestDrives, updateTestDriveStatus } from "@/actions/test-drive";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Car, Clock, User, Check, X } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import Loading from "@/components/Loading";

// Helper function to format time in 24-hour format
const formatTime = (timeString) => {
  if (!timeString) return "";

  // If the time is already in 24-hour format (HH:MM), return it as is
  if (/^\d{2}:\d{2}$/.test(timeString)) {
    return timeString;
  }

  // If the time includes AM/PM, convert to 24-hour format
  try {
    const [time, modifier] = timeString.split(" ");
    let [hours, minutes] = time.split(":");

    if (hours === "12") {
      hours = "00";
    }

    if (modifier === "PM") {
      hours = parseInt(hours, 10) + 12;
    }

    return `${hours.padStart(2, "0")}:${minutes}`;
  } catch (error) {
    // If any error in parsing, return the original string
    return timeString;
  }
};

const TestDrivesPage = () => {
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

  const fetchTestDrives = async () => {
    setLoading(true);
    try {
      const response = await getTestDrives({
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit,
      });

      if (response.success) {
        setTestDrives(response.data);
        setPagination(response.pagination);
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
  };

  useEffect(() => {
    fetchTestDrives();
  }, [statusFilter, pagination.page]);

  const handleStatusChange = async (testDriveId, newStatus) => {
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
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), "PPP");
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-0">
            Pending
          </Badge>
        );
      case "CONFIRMED":
        return (
          <Badge className="bg-green-100 text-green-800 border-0">
            Confirmed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-red-100 text-red-800 border-0">Cancelled</Badge>
        );
      default:
        return null;
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  if (loading && testDrives.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Drive Requests</CardTitle>
            <CardDescription>Manage test drive requests</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center min-h-[400px]">
            <Loading />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && testDrives.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Drive Requests</CardTitle>
            <CardDescription>Manage test drive requests</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center items-center min-h-[400px]">
            <div className="text-red-500 mb-4">Error: {error}</div>
            <Button onClick={fetchTestDrives}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Test Drive Requests</CardTitle>
            <CardDescription>Manage test drive requests</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Filter by status:</span>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {testDrives.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No test drive requests found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Car</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testDrives.map((testDrive) => (
                      <TableRow key={testDrive.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-16 overflow-hidden rounded-md">
                              {testDrive.car.images &&
                              testDrive.car.images[0] ? (
                                <Image
                                  src={testDrive.car.images[0]}
                                  alt={`${testDrive.car.make} ${testDrive.car.model}`}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                                  <Car className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <Link
                                href={`/cars/${testDrive.car.id}`}
                                className="font-medium hover:underline"
                              >
                                {testDrive.car.year} {testDrive.car.make}{" "}
                                {testDrive.car.model}
                              </Link>
                              <p className="text-sm text-gray-500">
                                ${Number(testDrive.car.price).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="relative h-8 w-8 overflow-hidden rounded-full">
                              {testDrive.user.imageUrl ? (
                                <Image
                                  src={testDrive.user.imageUrl}
                                  alt={testDrive.user.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-100 rounded-full">
                                  <User className="h-4 w-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">
                                {testDrive.user.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {testDrive.user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-gray-500" />
                              <span className="text-sm">
                                {formatDate(testDrive.date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3 text-gray-500" />
                              <span className="text-sm">
                                {formatTime(testDrive.startTime)} -{" "}
                                {formatTime(testDrive.endTime)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(testDrive.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {testDrive.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-green-500 text-green-500 hover:bg-green-50"
                                  onClick={() =>
                                    handleStatusChange(
                                      testDrive.id,
                                      "CONFIRMED"
                                    )
                                  }
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 border-red-500 text-red-500 hover:bg-red-50"
                                  onClick={() =>
                                    handleStatusChange(
                                      testDrive.id,
                                      "CANCELLED"
                                    )
                                  }
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              </>
                            )}
                            {testDrive.status === "CONFIRMED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 border-red-500 text-red-500 hover:bg-red-50"
                                onClick={() =>
                                  handleStatusChange(testDrive.id, "CANCELLED")
                                }
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestDrivesPage;
