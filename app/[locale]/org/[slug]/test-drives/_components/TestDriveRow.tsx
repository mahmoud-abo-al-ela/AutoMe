import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar, Car, Clock, User, Check, X, Eye } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { TestDriveStatusBadge } from "./TestDriveStatusBadge";
import { TestDriveDetailsModal } from "./TestDriveDetailsModal";
import { useState } from "react";
import { formatCarPrice } from "@/lib/utils/currency";
import type { TestDriveCar, TestDriveItemProps } from "./TestDrivesPresenter";

const formatTime = (timeString: string | null | undefined) => {
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
      hours = String(parseInt(hours, 10) + 12);
    }

    return `${hours.padStart(2, "0")}:${minutes}`;
  } catch (error) {
    return timeString;
  }
};

const formatDate = (dateString: string | Date) => {
  return format(new Date(dateString), "MMM dd, yyyy");
};

export const TestDriveRow = ({
  testDrive,
  onStatusChange,
  isDisabled = false,
  isUpdating = false,
}: TestDriveItemProps) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Nullable by serializeTestDrive's signature only; carId is a required FK.
  const car = testDrive.car as unknown as TestDriveCar;
  const carImages = (car.images ?? []) as string[];

  return (
    <>
      <TableRow
        className={`hover:bg-blue-50/30 transition-all duration-200 border-b border-gray-100 ${
          isDisabled ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <TableCell className="py-4 md:py-6">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative">
              <div className="relative h-12 w-16 md:h-16 md:w-20 lg:h-20 lg:w-28 overflow-hidden rounded-xl flex-shrink-0">
                {carImages[0] ? (
                  <Image
                    src={carImages[0]}
                    alt={`${car.make} ${car.model}`}
                    fill
                    className={`object-cover shadow-md border border-gray-200 transition-all ${
                      isDisabled ? "grayscale" : ""
                    }`}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 rounded-xl border border-gray-200">
                    <Car className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                {isUpdating && (
                  <div className="absolute inset-0 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  </div>
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/cars/${car.id}`}
                className="font-medium text-sm md:text-base hover:underline block truncate text-gray-900 hover:text-blue-600 transition-colors"
              >
                {car.title}
              </Link>
              <p className="text-sm md:text-base text-green-600 font-semibold mt-1">
                {formatCarPrice(Number(car.price))}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-4 md:py-6">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative h-8 w-8 md:h-10 md:w-10 overflow-hidden rounded-full flex-shrink-0">
              {testDrive.user?.imageUrl ? (
                <Image
                  src={testDrive.user.imageUrl}
                  alt={testDrive.user.name ?? ""}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 rounded-full">
                  <User className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm md:text-base truncate text-gray-900">
                {testDrive.user?.name || "Unknown User"}
              </p>
              <p className="text-xs md:text-sm text-gray-500 truncate">
                {testDrive.user?.email || "No email"}
              </p>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-4 md:py-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              <span className="text-xs sm:text-sm md:text-base text-gray-700">
                {formatDate(testDrive.date)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              <span className="text-xs sm:text-sm md:text-base text-gray-700">
                {formatTime(testDrive.startTime)} -{" "}
                {formatTime(testDrive.endTime)}
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-4 md:py-6">
          <TestDriveStatusBadge status={testDrive.status} />
        </TableCell>
        <TableCell className="py-4 md:py-6">
          <div className="flex items-center gap-1 md:gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="h-8 sm:h-10 px-2 sm:px-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setShowDetailsModal(true)}
              disabled={isDisabled}
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 lg:mr-1" />
              <span className="hidden lg:inline text-xs sm:text-sm">
                Details
              </span>
            </Button>

            {testDrive.status === "PENDING" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 sm:h-10 px-2 sm:px-3 border-green-500 text-green-600 hover:bg-green-50 cursor-pointer transition-colors"
                  onClick={() => onStatusChange(testDrive.id, "CONFIRMED")}
                  disabled={isDisabled}
                >
                  <Check className="h-3 w-3 sm:h-4 sm:w-4 lg:mr-1" />
                  <span className="hidden lg:inline text-xs sm:text-sm">
                    Confirm
                  </span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 sm:h-10 px-2 sm:px-3 border-red-500 text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                  onClick={() => onStatusChange(testDrive.id, "CANCELLED")}
                  disabled={isDisabled}
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 lg:mr-1" />
                  <span className="hidden lg:inline text-xs sm:text-sm">
                    Cancel
                  </span>
                </Button>
              </>
            )}
            {testDrive.status === "CONFIRMED" && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 sm:h-10 px-2 sm:px-3 border-red-500 text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                onClick={() => onStatusChange(testDrive.id, "CANCELLED")}
                disabled={isDisabled}
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 lg:mr-1" />
                <span className="hidden lg:inline text-xs sm:text-sm">
                  Cancel
                </span>
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      {/* Details Modal */}
      <TestDriveDetailsModal
        testDrive={testDrive}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </>
  );
};
