"use client";

import { useRouter, useSearchParams, useParams } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Filter, X, Search, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
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
import { useState, useEffect, useTransition } from "react";

const actionOptions = [
  { value: "all", label: "All Actions" },
  { value: "CAR_CREATED", label: "Car Created", type: "CAR" },
  { value: "CAR_UPDATED", label: "Car Updated", type: "CAR" },
  { value: "CAR_DELETED", label: "Car Deleted", type: "CAR" },
  { value: "CAR_STATUS_CHANGED", label: "Car Status Changed", type: "CAR" },
  { value: "TEST_DRIVE_CREATED", label: "Test Drive Created", type: "TEST_DRIVE" },
  { value: "TEST_DRIVE_CONFIRMED", label: "Test Drive Confirmed", type: "TEST_DRIVE" },
  { value: "TEST_DRIVE_CANCELED", label: "Test Drive Canceled", type: "TEST_DRIVE" },
  { value: "MEMBER_INVITED", label: "Member Invited", type: "MEMBERSHIP" },
  { value: "MEMBER_ROLE_CHANGED", label: "Member Role Changed", type: "MEMBERSHIP" },
  { value: "MEMBER_REMOVED", label: "Member Removed", type: "MEMBERSHIP" },
  { value: "SETTINGS_UPDATED", label: "Settings Updated", type: "SETTINGS" },
  { value: "ORG_UPDATED", label: "Org Updated", type: "ORGANIZATION" },
  { value: "CONVERSATION_CREATED", label: "Conversation Created", type: "CONVERSATION" },
];

const entityTypeOptions = [
  { value: "all", label: "All Types" },
  { value: "CAR", label: "Car" },
  { value: "TEST_DRIVE", label: "Test Drive" },
  { value: "MEMBERSHIP", label: "Membership" },
  { value: "ORGANIZATION", label: "Organization" },
  { value: "CONVERSATION", label: "Conversation" },
];

export default function AuditLogsFilters({ currentFilters }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { slug } = useParams();
  const [isPending, startTransition] = useTransition();

  // Local state for debounced inputs
  const [userIdInput, setUserIdInput] = useState(currentFilters.userId || "");
  const [date, setDate] = useState({
    from: currentFilters.startDate ? new Date(currentFilters.startDate) : undefined,
    to: currentFilters.endDate ? new Date(currentFilters.endDate) : undefined,
  });

  // Debounce User ID search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userIdInput !== (currentFilters.userId || "")) {
        updateFilter("userId", userIdInput);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [userIdInput]);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    // If changing entity type, clear action if it doesn't match
    if (key === "entityType") {
      params.delete("action");
    }

    params.delete("page");
    startTransition(() => {
      router.push(`/org/${slug}/audit-logs?${params.toString()}`);
    });
  };

  const filteredActionOptions = actionOptions.filter((option) => {
    if (option.value === "all") return true;
    if (!currentFilters.entityType || currentFilters.entityType === "all")
      return true;
    return option.type === currentFilters.entityType;
  });

  const handleDateSelect = (newDate) => {
    setDate(newDate);
    if (newDate?.from) {
      const params = new URLSearchParams(searchParams);
      params.set("startDate", newDate.from.toISOString());
      if (newDate.to) {
        params.set("endDate", newDate.to.toISOString());
      } else {
        params.delete("endDate");
      }
      params.delete("page");
      startTransition(() => {
        router.push(`/org/${slug}/audit-logs?${params.toString()}`);
      });
    } else {
      // Clear dates if nothing selected
      const params = new URLSearchParams(searchParams);
      params.delete("startDate");
      params.delete("endDate");
      params.delete("page");
      startTransition(() => {
        router.push(`/org/${slug}/audit-logs?${params.toString()}`);
      });
    }
  };

  const clearFilters = () => {
    setUserIdInput("");
    setDate(undefined);
    startTransition(() => {
      router.push(`/org/${slug}/audit-logs`);
    });
  };

  const hasFilters =
    currentFilters.action ||
    currentFilters.entityType ||
    currentFilters.userId ||
    currentFilters.startDate;

  return (
    <div className="flex gap-4 p-1">
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="flex gap-5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by User ID..."
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

          <div className="flex-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal bg-background",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={handleDateSelect}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex justify-end items-center gap-2 text-muted-foreground mr-2 text-sm font-medium">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Filter className="h-4 w-4" />
          )}
          <span>Filters:</span>
          <Select
            value={currentFilters.entityType || "all"}
            onValueChange={(value) => updateFilter("entityType", value)}
            disabled={isPending}
          >
            <SelectTrigger className="bg-background w-[180px]">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              {entityTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={currentFilters.action || "all"}
            onValueChange={(value) => updateFilter("action", value)}
            disabled={isPending}
          >
            <SelectTrigger className="bg-background w-[180px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              {filteredActionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              disabled={isPending}
              className="hover:bg-destructive/10 hover:text-destructive h-10 px-4 cursor-pointer"
            >
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
