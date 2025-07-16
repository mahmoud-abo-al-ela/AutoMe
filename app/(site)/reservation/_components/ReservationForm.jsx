"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { requestTestDrive } from "@/actions/test-drive";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const reservationSchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  notes: z.string().optional(),
});

const ReservationForm = ({
  carId,
  workingHours,
  availableDates,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      date: "",
      startTime: "",
      endTime: "",
      notes: "",
    },
  });

  const watchDate = watch("date");
  const watchStartTime = watch("startTime");

  // Function to generate time slots
  const generateTimeSlots = (openTime, closeTime) => {
    const slots = [];
    const [openHour, openMinute] = openTime.split(":").map(Number);
    const [closeHour, closeMinute] = closeTime.split(":").map(Number);

    let currentHour = openHour;
    let currentMinute = openMinute;

    while (
      currentHour < closeHour ||
      (currentHour === closeHour && currentMinute < closeMinute)
    ) {
      slots.push(
        `${currentHour.toString().padStart(2, "0")}:${currentMinute
          .toString()
          .padStart(2, "0")}`
      );

      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
    }

    return slots;
  };

  // Date selection handler
  const handleDateChange = (date) => {
    if (!date) return;

    const dateString = format(date, "yyyy-MM-dd");
    const dayOfWeek = {
      0: "SUNDAY",
      1: "MONDAY",
      2: "TUESDAY",
      3: "WEDNESDAY",
      4: "THURSDAY",
      5: "FRIDAY",
      6: "SATURDAY",
    }[date.getDay()];

    if (!workingHours[dayOfWeek]?.isOpen) {
      toast.error("The dealership is closed on this day");
      return;
    }

    setValue("date", dateString);
    setSelectedDay(dayOfWeek);
    setCalendarOpen(false);

    setValue("startTime", "");
    setValue("endTime", "");

    if (workingHours[dayOfWeek]) {
      const { openTime, closeTime } = workingHours[dayOfWeek];
      const slots = generateTimeSlots(openTime, closeTime);
      setAvailableTimeSlots(slots);
    }
  };

  // Time selection handlers
  const handleStartTimeSelect = (time) => {
    setValue("startTime", time);
    setValue("endTime", "");
  };

  const handleEndTimeSelect = (time) => {
    setValue("endTime", time);
  };

  // Get available end times based on selected start time
  const getAvailableEndTimes = () => {
    if (!watchStartTime || availableTimeSlots.length === 0) return [];

    const startIndex = availableTimeSlots.indexOf(watchStartTime);
    if (startIndex === -1) return [];

    return availableTimeSlots.slice(startIndex + 1);
  };

  // Disable dates that are in the past or when dealership is closed
  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date < today) return true;

    const dayOfWeek = {
      0: "SUNDAY",
      1: "MONDAY",
      2: "TUESDAY",
      3: "WEDNESDAY",
      4: "THURSDAY",
      5: "FRIDAY",
      6: "SATURDAY",
    }[date.getDay()];

    return !workingHours[dayOfWeek]?.isOpen;
  };

  // Form submission handler
  const onSubmit = async (data) => {
    if (!carId) {
      toast.error("Car information is missing");
      return;
    }

    setSubmitting(true);

    try {
      const result = await requestTestDrive({
        carId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes || "",
      });

      if (result.success) {
        toast.success("Test drive scheduled successfully!");
        onSuccess();
      } else {
        toast.error(result.error || "Failed to schedule test drive");
      }
    } catch (error) {
      console.error("Error scheduling test drive:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[0px] md:min-h-[500px]">
      <Card className="p-4 md:p-6 mx-2 md:mx-0 gap-3">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="date" className="block mb-2 font-medium">
              Select Date
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !watchDate && "text-muted-foreground",
                    errors.date && "border-red-500"
                  )}
                  disabled={availableDates.length === 0 || submitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watchDate ? (
                    format(new Date(watchDate), "EEEE, MMMM d, yyyy")
                  ) : (
                    <span>Select a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watchDate ? new Date(watchDate) : undefined}
                  onSelect={handleDateChange}
                  disabled={isDateDisabled}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <input type="hidden" {...register("date")} />
            {errors.date && (
              <span className="text-xs text-red-500 mt-1 block">
                {errors.date.message}
              </span>
            )}
            {selectedDay && workingHours[selectedDay] && (
              <div className="flex items-center text-xs mt-2 text-blue-600">
                <Clock className="w-3 h-3 mr-1" />
                Business hours: {workingHours[selectedDay].openTime} -{" "}
                {workingHours[selectedDay].closeTime}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime" className="block mb-2 font-medium">
                Start Time
              </Label>
              <Select
                disabled={
                  !watchDate || availableTimeSlots.length === 0 || submitting
                }
                onValueChange={handleStartTimeSelect}
              >
                <SelectTrigger
                  className={cn(errors.startTime && "border-red-500")}
                >
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" {...register("startTime")} />
              {errors.startTime && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errors.startTime.message}
                </span>
              )}
            </div>

            <div>
              <Label htmlFor="endTime" className="block mb-2 font-medium">
                End Time
              </Label>
              <Select
                disabled={
                  !watchStartTime ||
                  getAvailableEndTimes().length === 0 ||
                  submitting
                }
                onValueChange={handleEndTimeSelect}
              >
                <SelectTrigger
                  className={cn(errors.endTime && "border-red-500")}
                >
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableEndTimes().map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" {...register("endTime")} />
              {errors.endTime && (
                <span className="text-xs text-red-500 mt-1 block">
                  {errors.endTime.message}
                </span>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="block mb-2 font-medium">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Any specific requirements or questions?"
              className="resize-none"
              disabled={submitting}
              {...register("notes")}
            />
          </div>
          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
                Processing...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ReservationForm;
