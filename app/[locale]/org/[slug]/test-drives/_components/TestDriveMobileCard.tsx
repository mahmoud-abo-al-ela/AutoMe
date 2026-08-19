import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Car,
  Clock,
  User,
  Check,
  X,
  Eye,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { TestDriveStatusBadge } from "./TestDriveStatusBadge";
import { TestDriveDetailsModal } from "./TestDriveDetailsModal";
import { useState } from "react";
import { useFormatters } from "@/hooks/use-formatters";
import { formatCarPrice } from "@/lib/utils/currency";
import type { TestDriveCar, TestDriveItemProps } from "./TestDrivesPresenter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export const TestDriveMobileCard = ({
  testDrive,
  onStatusChange,
  isDisabled = false,
  isUpdating = false,
}: TestDriveItemProps) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { date: shortDate } = useFormatters();

  // Nullable by serializeTestDrive's signature only; carId is a required FK.
  const car = testDrive.car as unknown as TestDriveCar;
  const carImages = (car.images ?? []) as string[];

  return (
    <>
      <Card
        className={`overflow-hidden transition-all duration-200 p-0 ${
          isDisabled ? "opacity-60" : ""
        }`}
      >
        <CardContent className="p-4">
          {/* Car Information */}
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              {carImages[0] ? (
                <Image
                  src={carImages[0]}
                  alt={`${car.make} ${car.model}`}
                  width={112}
                  height={80}
                  className={` h-20 w-28 rounded-lg object-cover shadow-sm border border-gray-200 ${
                    isDisabled ? "grayscale" : ""
                  }`}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                  <Car className="h-6 w-6 text-gray-400" />
                </div>
              )}
              {isUpdating && (
                <div className="absolute inset-0 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-2">
              <Link
                href={`/cars/${car.id}`}
                className="font-semibold text-gray-900 text-sm truncate block"
              >
                {car.title}
              </Link>
              <p className="flex gap-4 font-bold text-lg text-green-700">
                {formatCarPrice(Number(car.price))}
                <TestDriveStatusBadge status={testDrive.status} />
              </p>
              <div className="flex items-center gap-1 text-gray-600 text-xs">
                <Calendar className="h-4 w-4" />
                <span>
                  {shortDate(testDrive.date)}
                </span>
                <span>
                  {formatTime(testDrive.startTime)} -{" "}
                  {formatTime(testDrive.endTime)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                    disabled={isDisabled}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowDetailsModal(true)}>
                    <Eye className="h-4 w-4 me-2" />
                    View Details
                  </DropdownMenuItem>
                  {testDrive.status === "PENDING" && (
                    <>
                      <DropdownMenuItem
                        onClick={() =>
                          onStatusChange(testDrive.id, "CONFIRMED")
                        }
                        className="text-green-600 focus:text-green-600"
                      >
                        <Check className="h-4 w-4 me-2" />
                        Confirm
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          onStatusChange(testDrive.id, "CANCELLED")
                        }
                        className="text-red-600 focus:text-red-600"
                      >
                        <X className="h-4 w-4 me-2" />
                        Cancel
                      </DropdownMenuItem>
                    </>
                  )}
                  {testDrive.status === "CONFIRMED" && (
                    <DropdownMenuItem
                      onClick={() => onStatusChange(testDrive.id, "CANCELLED")}
                      className="text-red-600 focus:text-red-600"
                    >
                      <X className="h-4 w-4 me-2" />
                      Cancel
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <TestDriveDetailsModal
        testDrive={testDrive}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />
    </>
  );
};
