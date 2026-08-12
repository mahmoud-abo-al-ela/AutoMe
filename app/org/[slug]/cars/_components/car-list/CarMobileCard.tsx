"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
    Calendar,
    MapPin,
    Star,
    DollarSign,
    MoreVertical,
    Eye,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    Pencil,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StatusBadge from "./StatusBadge";
import type { CarRowProps } from "./CarsListPresenter";

const CarMobileCard = ({
    car,
    isCarDisabled,
    isThisCarUpdating,
    isThisCarDeleting,
    onUpdateCar,
    onConfirmDelete,
}: CarRowProps) => {
    const params = useParams();
    const router = useRouter();
    const slug = params?.slug;
    const carStatus = car.status.toLowerCase();
    return (
        <Card className={`overflow-hidden transition-all duration-200 p-0 ${isCarDisabled ? "opacity-60" : ""
            }`}>
            <CardContent className="p-4">
                {/* Car Image and Basic Info */}
                <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                        <Image
                            src={car.images[0]}
                            alt={car.title ?? ""}
                            className={`h-20 w-28 rounded-lg object-cover shadow-sm border border-gray-200 ${isCarDisabled ? "grayscale" : ""
                                }`}
                            width={112}
                            height={80}
                        />
                        {isThisCarDeleting && (
                            <div className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                            </div>
                        )}
                        {isThisCarUpdating && (
                            <div className="absolute inset-0 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                            </div>
                        )}
                        {car.featured && (
                            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                                <Star className="h-3 w-3 text-white" fill="currentColor" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate mb-1">
                            {car.title}
                        </h3>

                        {/* Price */}
                        <div className="font-bold text-lg text-green-700">
                            ${car.price.toLocaleString()}
                        </div>

                        {/* Status Badge */}

                        <div className="flex justify-between items-center gap-1 text-gray-600 text-sm">
                            <StatusBadge status={carStatus} />
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    {new Date(car.createdAt
                                    ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "numeric",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-8 w-8 p-0 cursor-pointer"
                                disabled={isCarDisabled}
                            >
                                <span className="sr-only">Open menu</span>
                                {isThisCarUpdating || isThisCarDeleting ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                                ) : (
                                    <MoreVertical className="h-4 w-4" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => window.open(`/cars/${car.id}`, "_blank")}
                                className="cursor-pointer"
                                disabled={isCarDisabled}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => router.push(`/org/${slug}/cars/${car.id}/edit`)}
                                className="cursor-pointer"
                                disabled={isCarDisabled}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    onUpdateCar(car.id, {
                                        featured: !car.featured,
                                        status: car.status,
                                    })
                                }
                                className="cursor-pointer"
                                disabled={isCarDisabled}
                            >
                                <Star className="mr-2 h-4 w-4" />
                                {car.featured ? "Remove Featured" : "Make Featured"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            {carStatus !== "available" && (
                                <DropdownMenuItem
                                    onClick={() =>
                                        onUpdateCar(car.id, {
                                            status: "AVAILABLE",
                                            featured: car.featured,
                                        })
                                    }
                                    className="cursor-pointer"
                                    disabled={isCarDisabled}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                    Mark Available
                                </DropdownMenuItem>
                            )}
                            {carStatus !== "sold" && (
                                <DropdownMenuItem
                                    onClick={() =>
                                        onUpdateCar(car.id, {
                                            status: "SOLD",
                                            featured: car.featured,
                                        })
                                    }
                                    className="cursor-pointer"
                                    disabled={isCarDisabled}
                                >
                                    <XCircle className="mr-2 h-4 w-4 text-gray-600" />
                                    Mark as Sold
                                </DropdownMenuItem>
                            )}
                            {carStatus !== "unavailable" && (
                                <DropdownMenuItem
                                    onClick={() =>
                                        onUpdateCar(car.id, {
                                            status: "UNAVAILABLE",
                                            featured: car.featured,
                                        })
                                    }
                                    className="cursor-pointer"
                                    disabled={isCarDisabled}
                                >
                                    <Clock className="mr-2 h-4 w-4 text-gray-600" />
                                    Mark Unavailable
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onConfirmDelete(car)}
                                className="cursor-pointer text-red-600 focus:text-red-600"
                                disabled={isCarDisabled}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Car
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    );
};

export default CarMobileCard;