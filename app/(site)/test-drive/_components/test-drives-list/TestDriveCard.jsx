"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Car, ChevronRight } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const TestDriveCard = ({ testDrive, onViewDetails, onViewCar }) => {
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
        >
            <div className="flex flex-col sm:flex-row">
                <div className="relative w-full sm:w-48 h-32 sm:h-36">
                    {testDrive.car?.images && testDrive.car.images.length > 0 ? (
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
                            onClick={() => onViewCar(testDrive.car?.id)}
                            disabled={!testDrive.car?.id}
                        >
                            View Car
                        </Button>
                        <Button
                            size="sm"
                            className="cursor-pointer text-xs sm:text-sm"
                            onClick={() => onViewDetails(testDrive.id)}
                            disabled={testDrive.status === "CANCELLED"}
                        >
                            {testDrive.status === "CANCELLED" ? "Cancelled" : "Manage"}
                            {testDrive.status === "CANCELLED" ? null : (
                                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default TestDriveCard;