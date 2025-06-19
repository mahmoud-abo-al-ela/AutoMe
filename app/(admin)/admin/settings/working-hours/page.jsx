"use client";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import useFetch from "@/hooks/use-fetch";
import { getDealershipInfo, updateWorkingHours } from "@/actions/settings";
import { Clock, Loader2 } from "lucide-react";
import WorkingHoursSkeleton from "../_components/Skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const DAYS = [
  { label: "Monday", value: "MONDAY" },
  { label: "Tuesday", value: "TUESDAY" },
  { label: "Wednesday", value: "WEDNESDAY" },
  { label: "Thursday", value: "THURSDAY" },
  { label: "Friday", value: "FRIDAY" },
  { label: "Saturday", value: "SATURDAY" },
  { label: "Sunday", value: "SUNDAY" },
];

export default function AdminWorkingHours() {
  const {
    data: dealershipData,
    loading: loadingDealershipData,
    error: dealershipError,
    fn: fetchDealershipData,
  } = useFetch(getDealershipInfo, true);
  const {
    data: updateWorkingHoursData,
    loading: loadingUpdateWorkingHours,
    error: updateWorkingHoursError,
    fn: updateWorkingHoursFn,
  } = useFetch(updateWorkingHours);

  useEffect(() => {
    fetchDealershipData();
  }, []);

  useEffect(() => {
    if (dealershipData?.data?.workingHours) {
      const formattedHours = {};

      dealershipData.data.workingHours.forEach((hour) => {
        const day = Array.isArray(hour.dayOfWeek)
          ? hour.dayOfWeek[0]
          : hour.dayOfWeek;

        formattedHours[day] = {
          dayOfWeek: day,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
          isOpen: hour.isOpen,
        };
      });

      setWorkingHours(formattedHours);
    }
  }, [dealershipData]);

  const [workingHours, setWorkingHours] = useState(
    DAYS.reduce((acc, day) => {
      acc[day.value] = {
        dayOfWeek: day.value,
        openTime: "09:00",
        closeTime: "18:00",
        isOpen: day.value !== "SUNDAY",
      };
      return acc;
    }, {})
  );

  const handleDayToggle = (day, isOpen) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], isOpen },
    }));
  };

  const handleTimeChange = (day, type, value) => {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [type]: value },
    }));
  };

  const handleSave = async () => {
    // Convert the object to an array for the server action
    const hoursArray = Object.values(workingHours).map((hour) => ({
      ...hour,
      dayOfWeek: [hour.dayOfWeek], // Ensure dayOfWeek is an array
    }));

    try {
      const response = await updateWorkingHoursFn(hoursArray);
      if (response.success) {
        toast.success("Working hours updated successfully");
      }
    } catch (error) {
      toast.error("Failed to update working hours");
    }
  };

  return (
    <div className="p-3 sm:p-6">
      <Toaster richColors position="top-right" expand={true} />
      <div className="flex sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6 items-center">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-blue-50 p-2 rounded-lg">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
              Working Hours
            </h1>
            <p className="text-xs sm:text-base text-gray-500">
              Configure your business operating hours
            </p>
          </div>
        </div>
      </div>

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
          <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-6">
            {DAYS.map((day) => (
              <div
                key={day.value}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-4 border rounded-lg"
              >
                <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-0">
                  <Switch
                    checked={workingHours[day.value]?.isOpen || false}
                    onCheckedChange={(isOpen) => {
                      handleDayToggle(day.value, isOpen);
                    }}
                    className="cursor-pointer"
                  />
                  <Label className="text-sm sm:text-base font-medium">
                    {day.label}
                  </Label>
                </div>

                {workingHours[day.value]?.isOpen ? (
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center w-full sm:w-auto">
                      <Input
                        type="time"
                        value={workingHours[day.value]?.openTime || "09:00"}
                        onChange={(e) =>
                          handleTimeChange(
                            day.value,
                            "openTime",
                            e.target.value
                          )
                        }
                        className="w-full text-xs sm:text-sm h-8 sm:h-10"
                      />
                      <span className="text-gray-500 mx-1 sm:mx-2 whitespace-nowrap text-xs sm:text-sm">
                        to
                      </span>
                      <Input
                        type="time"
                        value={workingHours[day.value]?.closeTime || "18:00"}
                        onChange={(e) =>
                          handleTimeChange(
                            day.value,
                            "closeTime",
                            e.target.value
                          )
                        }
                        className="w-full text-xs sm:text-sm h-8 sm:h-10"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500 font-medium text-xs sm:text-base">
                    Closed
                  </span>
                )}
              </div>
            ))}

            <div className="pt-4 border-t">
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
