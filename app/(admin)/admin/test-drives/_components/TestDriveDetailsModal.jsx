import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Car, User, FileText } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { TestDriveStatusBadge } from "./TestDriveStatusBadge";

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

export const TestDriveDetailsModal = ({ testDrive, isOpen, onClose }) => {
  if (!testDrive) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="text-left space-y-1.5">
          <DialogTitle>Test Drive Details</DialogTitle>
          <DialogDescription>
            Complete information for this test drive request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Car Information */}
          <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg bg-gray-50/50">
            <div className="relative h-20 w-24 sm:w-28 overflow-hidden rounded-md flex-shrink-0 border bg-white">
              {testDrive.car.images && testDrive.car.images[0] ? (
                <Image
                  src={testDrive.car.images[0]}
                  alt={`${testDrive.car.make} ${testDrive.car.model}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                  <Car className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 py-1">
              <Link
                href={`/cars/${testDrive.car.id}`}
                className="text-base sm:text-lg font-semibold hover:underline block truncate text-gray-900"
              >
                {testDrive.car.title}
              </Link>
              <p className="text-lg sm:text-xl font-bold text-green-600 mt-0.5">
                ${Number(testDrive.car.price).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Customer Information */}
          <div className="p-3 sm:p-4 border rounded-lg">
            <h3 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <User className="h-4 w-4" />
              Customer Information
            </h3>
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-full flex-shrink-0">
                {testDrive.user?.imageUrl ? (
                  <Image
                    src={testDrive.user.imageUrl}
                    alt={testDrive.user.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 rounded-full">
                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm sm:text-base">
                  {testDrive.user?.name || "Unknown User"}
                </p>
                <p className="text-gray-600 text-xs sm:text-sm truncate">
                  {testDrive.user?.email || "No email"}
                </p>
              </div>
            </div>
          </div>

          {/* Date & Time Information */}
          <div className="p-3 sm:p-4 border rounded-lg">
            <h3 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Calendar className="h-4 w-4" />
              Schedule
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pl-6 sm:pl-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Date:</span>
                <span>{formatDate(testDrive.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Time:</span>
                <span>
                  {formatTime(testDrive.startTime)} -{" "}
                  {formatTime(testDrive.endTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes Section - Only show if notes exist */}
          {testDrive.notes && testDrive.notes.trim() && (
            <div className="p-3 sm:p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <FileText className="h-4 w-4" />
                Customer Notes
              </h3>
              <div className="bg-gray-50 p-2 sm:p-3 rounded-md">
                <p className="text-gray-700 whitespace-pre-wrap text-sm">
                  {testDrive.notes}
                </p>
              </div>
            </div>
          )}

          {/* Request Information */}
          <div className="p-3 sm:p-4 border rounded-lg">
            <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
              Request Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Status:</span>
                <TestDriveStatusBadge status={testDrive.status} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Created:</span>
                <p className="truncate">
                  {testDrive.createdAt
                    ? format(new Date(testDrive.createdAt), "PPp")
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 sm:pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="cursor-pointer w-full sm:w-auto"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
