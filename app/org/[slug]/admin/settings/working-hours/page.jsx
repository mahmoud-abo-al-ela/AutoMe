"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import WorkingHoursSkeleton from "../_components/Skeleton";
import WorkingHoursHeader from "./_components/WorkingHoursHeader";
import WorkingHoursForm from "./_components/WorkingHoursForm";
import { useWorkingHours } from "./_components/useWorkingHours";

export default function AdminWorkingHours() {
  const {
    workingHours,
    loadingDealershipData,
    loadingUpdateWorkingHours,
    handleDayToggle,
    handleTimeChange,
    handleSave,
  } = useWorkingHours();

  return (
    <div className="p-3 sm:p-6">
      <Toaster richColors position="top-right" expand={true} />
      <WorkingHoursHeader />

      {loadingDealershipData ? (
        <WorkingHoursSkeleton />
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="text-center sm:text-left py-0">
            <CardTitle className="text-lg sm:text-xl">Business Hours</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Set your operating hours for each day of the week. Customers will
              see these hours on your website.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <WorkingHoursForm
              workingHours={workingHours}
              onDayToggle={handleDayToggle}
              onTimeChange={handleTimeChange}
            />

            <div className="pt-4 border-t mt-6">
              <Button
                onClick={handleSave}
                className="w-full cursor-pointer bg-primary text-white hover:bg-primary/90 h-10 sm:h-11 text-sm sm:text-base"
                disabled={loadingUpdateWorkingHours}
              >
                {loadingUpdateWorkingHours ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-base">Saving...</span>
                  </span>
                ) : (
                  "Save Working Hours"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
