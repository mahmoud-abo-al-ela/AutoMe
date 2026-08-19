"use client";
import { useFormatters } from "@/hooks/use-formatters";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DayOfWeek, WorkingHours } from "../../_lib/scheduling";

const DateSelector = ({
    selectedDate,
    onDateChange,
    isDateDisabled,
    error,
    disabled,
    calendarOpen,
    setCalendarOpen,
    selectedDay,
    workingHours,
}: {
    selectedDate: string;
    onDateChange: (date: Date | undefined) => void;
    isDateDisabled: (date: Date) => boolean;
    error?: string;
    disabled: boolean;
    calendarOpen: boolean;
    setCalendarOpen: (open: boolean) => void;
    selectedDay: DayOfWeek | null;
    workingHours: WorkingHours;
}) => {
  const { date: fmtDate } = useFormatters();
    return (
        <div>
            <Label htmlFor="date" className="block mb-2 font-medium">
                Select Date
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-start font-normal",
                            !selectedDate && "text-muted-foreground",
                            error && "border-red-500"
                        )}
                        disabled={disabled}
                    >
                        <CalendarIcon className="me-2 h-4 w-4" />
                        {selectedDate ? (
                            fmtDate(new Date(selectedDate), { weekday: "long", month: "long" })
                        ) : (
                            <span>Select a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={selectedDate ? new Date(selectedDate) : undefined}
                        onSelect={onDateChange}
                        disabled={isDateDisabled}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            {error && (
                <span className="text-xs text-red-500 mt-1 block">{error}</span>
            )}
            {selectedDay && workingHours[selectedDay] && (
                <div className="flex items-center text-xs mt-2 text-blue-600">
                    <Clock className="w-3 h-3 me-1" />
                    Business hours: {workingHours[selectedDay].openTime} -{" "}
                    {workingHours[selectedDay].closeTime}
                </div>
            )}
        </div>
    );
};

export default DateSelector;
