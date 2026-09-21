"use client";
import { useFormatters } from "@/hooks/use-formatters";

import { useTranslations } from "next-intl";
import { useSearchParams, useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Calendar as CalendarIcon, Filter, X, Search, Loader2 } from "lucide-react";
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
import type { DateRange } from "react-day-picker";
import type { AuditLogFilters } from "../_lib/audit-types";
import { useAuditLabels } from "../_lib/use-audit-labels";
import type { AuditAction, EntityType } from "@/lib/generated/prisma";

// Typed against the Prisma enums, so an option that no action can ever carry
// fails to compile instead of quietly filtering to zero rows. The label is
// looked up by the enum member the database stores, so an option and the
// badge the table renders for the same action cannot drift apart.
const actionOptions: { value: AuditAction; type: EntityType }[] = [
  { value: "CAR_CREATED", type: "CAR" },
  { value: "CAR_UPDATED", type: "CAR" },
  { value: "CAR_DELETED", type: "CAR" },
  { value: "CAR_STATUS_CHANGED", type: "CAR" },
  { value: "TEST_DRIVE_CREATED", type: "TEST_DRIVE" },
  { value: "TEST_DRIVE_CONFIRMED", type: "TEST_DRIVE" },
  { value: "TEST_DRIVE_CANCELED", type: "TEST_DRIVE" },
  { value: "MEMBER_INVITED", type: "MEMBERSHIP" },
  { value: "MEMBER_ROLE_CHANGED", type: "MEMBERSHIP" },
  { value: "MEMBER_REMOVED", type: "MEMBERSHIP" },
  { value: "ORG_SETTINGS_UPDATED", type: "ORGANIZATION" },
  { value: "ORG_UPDATED", type: "ORGANIZATION" },
];

const entityTypeOptions: EntityType[] = [
  "CAR",
  "TEST_DRIVE",
  "MEMBERSHIP",
  "ORGANIZATION",
];

export default function AuditLogsFilters({
  currentFilters,
}: {
  currentFilters: AuditLogFilters;
}) {
  const t = useTranslations("org.auditLogs.filters");
  const label = useAuditLabels();
  const { date: fmtDate } = useFormatters();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { slug } = useParams();
  const [isPending, startTransition] = useTransition();

  // Local state for debounced inputs
  const [userIdInput, setUserIdInput] = useState(currentFilters.userId || "");
  const [date, setDate] = useState<DateRange | undefined>({
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
    // Deliberately keyed on the typed value alone: `updateFilter` is recreated
    // every render, and re-running on `currentFilters.userId` would fire the
    // debounce again on the navigation it just caused.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdInput]);

  const updateFilter = (key: string, value: string) => {
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
    if (!currentFilters.entityType || currentFilters.entityType === "all")
      return true;
    return option.type === currentFilters.entityType;
  });

  const handleDateSelect = (newDate: DateRange | undefined) => {
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
            <Search className="absolute start-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              className="ps-9 bg-background"
            />
          </div>

          <div className="flex-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-start font-normal bg-background",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="me-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      t("dateRange", {
                        start: fmtDate(date.from),
                        end: fmtDate(date.to),
                      })
                    ) : (
                      fmtDate(date.from)
                    )
                  ) : (
                    <span>{t("dateRangePlaceholder")}</span>
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
        <div className="flex justify-end items-center gap-2 text-muted-foreground me-2 text-sm font-medium">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Filter className="h-4 w-4" />
          )}
          <span>{t("label")}</span>
          <Select
            value={currentFilters.entityType || "all"}
            onValueChange={(value) => updateFilter("entityType", value)}
            disabled={isPending}
          >
            <SelectTrigger className="bg-background w-[180px]">
              <SelectValue placeholder={t("entityTypePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allEntityTypes")}</SelectItem>
              {entityTypeOptions.map((entityType) => (
                <SelectItem key={entityType} value={entityType}>
                  {label.entity(entityType)}
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
              <SelectValue placeholder={t("actionPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allActions")}</SelectItem>
              {filteredActionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {label.action(option.value)}
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
              <X className="h-4 w-4 me-2" />
              {t("reset")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
