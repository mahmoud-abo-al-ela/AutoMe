"use client";

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
import { Pagination } from "@/components/common/Pagination";

const formatTime = (timeString) => {
    if (!timeString) return "";

    if (/^\d{2}:\d{2}$/.test(timeString)) {
        return timeString;
    }

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
        return timeString;
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

export const TestDrivesPresenter = ({
    testDrives,
    loading,
    error,
    statusFilter,
    pagination,
    handlers,
}) => {
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
                        <Button onClick={handlers.retry}>Try Again</Button>
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
                        <Select value={statusFilter} onValueChange={handlers.handleFilterChange}>
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
                                                                        handlers.handleStatusChange(
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
                                                                        handlers.handleStatusChange(
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
                                                                    handlers.handleStatusChange(testDrive.id, "CANCELLED")
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

                            {pagination.total > pagination.limit && (
                                <div className="mt-6">
                                    <Pagination
                                        currentPage={pagination.page}
                                        totalPages={pagination.totalPages}
                                        onPageChange={handlers.handlePageChange}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
