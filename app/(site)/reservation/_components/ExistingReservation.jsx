"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, Trash2, Edit, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cancelTestDriveByUser } from "@/actions/test-drive";
import { Skeleton } from "@/components/ui/skeleton";

export const ReservationSkeleton = () => {
  return (
    <div className="min-h-[400px] md:min-h-[500px]">
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-start">
            <Skeleton className="h-5 w-5 mr-2 rounded-full" />
            <div className="space-y-2 w-full">
              <Skeleton className="h-5 w-36" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </Card>
    </div>
  );
};

const ExistingReservation = ({ testDrive, onEditClick, loading }) => {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (loading) {
    return <ReservationSkeleton />;
  }

  if (!testDrive) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center py-8">
          <Info className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No test drive selected</h3>
          <p className="text-muted-foreground mb-4">
            Please select a test drive from your list or schedule a new one.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => router.push("/reservation")}
              variant="outline"
              className="cursor-pointer"
            >
              View All Test Drives
            </Button>
            <Button
              onClick={() => router.push("/cars")}
              className="cursor-pointer"
            >
              Browse Cars
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const handleCancelTestDrive = async () => {
    setIsDeleting(true);
    try {
      const result = await cancelTestDriveByUser(testDrive.id);
      if (result.success) {
        toast.success("Test drive cancelled successfully");
        setIsDeleteDialogOpen(false);
        router.push("/reservation");
      }
    } catch (error) {
      console.error("Error cancelling test drive:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return format(new Date(date), "EEEE, MMMM d, yyyy");
  };
  return (
    <div className="min-h-[400px] md:min-h-[450px]">
      <Card className="p-4 gap-3 mx-2 md:mx-0">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-xl font-semibold">Test Drive Status</h2>
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
              testDrive.status === "PENDING"
                ? "bg-yellow-100 text-yellow-800"
                : testDrive.status === "CONFIRMED"
                ? "bg-green-100 text-green-800"
                : testDrive.status === "CANCELLED"
                ? "bg-red-100 text-red-800"
                : testDrive.status === "COMPLETED"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {testDrive.status}
          </span>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2 md:p-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-blue-800">
                  {testDrive?.car.title}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center text-sm text-blue-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(testDrive.date)}
                  </div>
                  <div className="flex items-center text-sm text-blue-700">
                    <Clock className="h-4 w-4 mr-2" />
                    {testDrive.startTime} - {testDrive.endTime}
                  </div>
                </div>
                {testDrive.notes && (
                  <div className="text-sm text-blue-700 mt-2">
                    <p className="font-medium">Notes:</p>
                    <p>{testDrive.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={onEditClick}
              disabled={
                testDrive.status !== "PENDING" &&
                testDrive.status !== "CONFIRMED"
              }
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={
                testDrive.status === "CANCELLED" ||
                testDrive.status === "COMPLETED"
              }
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>

          {testDrive.status === "CONFIRMED" && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-4">
              <p className="text-sm text-green-800">
                Your test drive has been confirmed. Please arrive 10 minutes
                before your scheduled time.
              </p>
            </div>
          )}

          {testDrive.status === "CANCELLED" && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
              <p className="text-sm text-red-800">
                This test drive has been cancelled. You can schedule a new one
                if you're still interested.
              </p>
            </div>
          )}

          {testDrive.status === "COMPLETED" && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
              <p className="text-sm text-blue-800">
                This test drive has been completed. We hope you enjoyed the
                experience!
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Test Drive</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your test drive? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-2">
            <div className="flex items-start">
              <Info className="h-4 w-4 mr-2 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm text-amber-800">
                  {testDrive?.car?.title}
                  <br />
                  {formatDate(testDrive.date)} <br /> {testDrive.startTime} -{" "}
                  {testDrive.endTime}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Keep Reservation
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelTestDrive}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                  Cancelling...
                </>
              ) : (
                "Cancel Reservation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExistingReservation;
