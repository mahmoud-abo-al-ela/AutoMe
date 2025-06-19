import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Star,
  DollarSign,
  XCircle,
  Trash2,
  MoreHorizontal,
  Eye,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StatusBadge from "./StatusBadge";

const CarTableRow = ({
  car,
  isCarDisabled,
  isThisCarUpdating,
  isThisCarDeleting,
  onUpdateCar,
  onConfirmDelete,
}) => {
  // Normalize status to lowercase for consistent comparison
  const carStatus = car.status.toLowerCase();

  return (
    <TableRow
      key={car.id}
      className={`hover:bg-blue-50/30 transition-all duration-200 border-b border-gray-100 ${
        isCarDisabled ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      <TableCell className="py-4 md:py-6">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative">
            <Image
              src={car.images[0]}
              alt={car.title}
              className={`h-12 w-20 md:h-16 rounded-xl object-cover shadow-md border border-gray-200 transition-all relative ${
                isCarDisabled ? "grayscale" : ""
              }`}
              width={80}
              height={64}
            />
            {isThisCarDeleting && (
              <div className="absolute inset-0 bg-red-500/20 rounded-xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
              </div>
            )}
            {isThisCarUpdating && (
              <div className="absolute inset-0 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              </div>
            )}
            {car.featured && (
              <Star
                className="ml-1 text-yellow-400 absolute -top-2 -left-2 sm:hidden"
                size={20}
                fill="currentColor"
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 mb-1 max-w-[150px] md:max-w-none flex items-center overflow-hidden">
              <span className="truncate">{car.title}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 md:gap-3 text-xs text-gray-500 mt-1">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{car.year}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-16 md:max-w-24">
                  {car.location}
                </span>
              </div>
              <div className="flex md:hidden items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded">
                <DollarSign className="h-3 w-3 text-green-600" />
                <span className="font-semibold text-green-700">
                  {car.price.toLocaleString()}
                </span>
              </div>
              <div className="flex md:hidden">
                <StatusBadge status={carStatus} compact={true} />
              </div>
              <div className="hidden md:flex items-center gap-1">
                <span className="text-xs text-gray-500">
                  Added: {new Date(car.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4 md:py-6 hidden md:table-cell">
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-bold text-base md:text-lg text-gray-900">
              {car.price.toLocaleString()}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4 md:py-6 hidden md:table-cell">
        <div className="space-y-2">
          <StatusBadge status={carStatus} />
        </div>
      </TableCell>
      <TableCell className="py-4 md:py-6 hidden md:table-cell">
        <div className="space-y-2 w-fit">
          {car.featured ? (
            <div className="flex items-center gap-1 bg-yellow-500/20 p-2 rounded-md">
              <Star className="h-4 w-4 text-yellow-400" size={20} />
              <span className="text-xs text-gray-500">Featured</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-gray-500/20 p-2 rounded-md">
              <XCircle className="h-4 w-4 text-gray-600" size={20} />
              <span className="text-xs text-gray-500">Not Featured</span>
            </div>
          )}
        </div>
      </TableCell>

      <TableCell className="p-0 md:py-6">
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 relative cursor-pointer"
                disabled={isCarDisabled}
              >
                <span className="sr-only">Open menu</span>
                {isThisCarUpdating || isThisCarDeleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                ) : (
                  <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-36 sm:w-48 bg-white border shadow-lg"
            >
              <DropdownMenuLabel className="text-xs sm:text-sm">
                Actions
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => window.open(`/cars/${car.id}`, "_blank")}
                className="cursor-pointer"
                disabled={isCarDisabled}
              >
                <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">View</span>
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
                <Star className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">
                  {car.featured ? "Unfeature" : "Feature"}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs sm:text-sm">
                Status
              </DropdownMenuLabel>
              {carStatus !== "available" && (
                <DropdownMenuItem
                  onClick={() =>
                    onUpdateCar(car.id, {
                      status: "AVAILABLE",
                      featured: car.featured, // Maintain featured status
                    })
                  }
                  className="cursor-pointer"
                  disabled={isCarDisabled}
                >
                  <CheckCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  <span className="text-xs sm:text-sm">Available</span>
                </DropdownMenuItem>
              )}{" "}
              {carStatus !== "sold" && (
                <DropdownMenuItem
                  onClick={() =>
                    onUpdateCar(car.id, {
                      status: "SOLD",
                      featured: car.featured, // Maintain featured status
                    })
                  }
                  className="cursor-pointer"
                  disabled={isCarDisabled}
                >
                  <XCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                  <span className="text-xs sm:text-sm">Sold</span>
                </DropdownMenuItem>
              )}{" "}
              {carStatus !== "unavailable" && (
                <DropdownMenuItem
                  onClick={() =>
                    onUpdateCar(car.id, {
                      status: "UNAVAILABLE",
                      featured: car.featured, // Maintain featured status
                    })
                  }
                  className="cursor-pointer"
                  disabled={isCarDisabled}
                >
                  <Clock className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                  <span className="text-xs sm:text-sm">Unavailable</span>
                </DropdownMenuItem>
              )}{" "}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onConfirmDelete(car)}
                className="cursor-pointer text-red-600 focus:text-red-600"
                disabled={isCarDisabled}
              >
                <Trash2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default CarTableRow;
