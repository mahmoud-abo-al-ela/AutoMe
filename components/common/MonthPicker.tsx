"use client";

import { useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";

type MonthPickerProps = {
  id?: string;
  /** "YYYY-MM", or "" for none. */
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Label for the control that empties the value; omit to not offer it. */
  clearLabel?: string;
  previousYearLabel: string;
  nextYearLabel: string;
};

const MONTHS = Array.from({ length: 12 }, (_, index) => index);

const parse = (value: string) => {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  return match ? { year: Number(match[1]), month: Number(match[2]) - 1 } : null;
};

/**
 * A month-and-year picker in the shadcn idiom: an outline Button opening a
 * Popover with a year header and a grid of months.
 *
 * Month, not day, on purpose — the shadcn Calendar would ask for a day the
 * value never stores. Month names and the year come from the shared
 * formatters, so Arabic reads "مارس ٢٠٢٧" like every other date on the page,
 * and are formatted in UTC so no reader's timezone can move the month.
 */
export function MonthPicker({
  id,
  value,
  onChange,
  placeholder,
  clearLabel,
  previousYearLabel,
  nextYearLabel,
}: MonthPickerProps) {
  const fmt = useFormatters();
  const selected = parse(value);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => selected?.year ?? new Date().getUTCFullYear());

  const monthDate = (y: number, m: number) => new Date(Date.UTC(y, m, 1));
  const label = selected
    ? fmt.date(monthDate(selected.year, selected.month), {
        // formatDate adds a day by default; a month has none.
        day: undefined,
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : placeholder;

  const pick = (month: number) => {
    onChange(`${year}-${String(month + 1).padStart(2, "0")}`);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // Reopen on the selected year rather than wherever it was left.
        if (next && selected) setYear(selected.year);
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn("w-full justify-start text-start font-normal", !selected && "text-muted-foreground")}
        >
          <CalendarIcon className="me-2 h-4 w-4" aria-hidden />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="mb-3 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label={previousYearLabel}
            onClick={() => setYear(year - 1)}
          >
            {/* "Previous" points at the reader's starting edge. */}
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Button>
          <span className="text-sm font-medium tabular-nums">
            {fmt.number(year, { useGrouping: false })}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label={nextYearLabel}
            onClick={() => setYear(year + 1)}
          >
            <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((month) => {
            const isSelected = selected?.year === year && selected.month === month;
            return (
              <Button
                key={month}
                type="button"
                size="sm"
                variant={isSelected ? "default" : "ghost"}
                aria-pressed={isSelected}
                onClick={() => pick(month)}
              >
                {fmt.date(monthDate(year, month), {
                  day: undefined,
                  year: undefined,
                  month: "short",
                  timeZone: "UTC",
                })}
              </Button>
            );
          })}
        </div>

        {clearLabel && selected && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 w-full text-muted-foreground"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            {clearLabel}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
