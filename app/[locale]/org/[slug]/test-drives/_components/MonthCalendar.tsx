"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import type { DayOfWeek } from "@/lib/generated/prisma";
import { cn } from "@/lib/utils";

/** Egypt's week starts on Saturday; Friday is its weekend. */
const WEEKDAYS: DayOfWeek[] = ["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
/** A Saturday, to name the weekdays in the reader's language from. */
const A_SATURDAY = Date.UTC(2026, 9, 3);
const DAY_MS = 86_400_000;

const iso = (time: number) => new Date(time).toISOString().slice(0, 10);

/** The month's days in Saturday-first weeks, with the neighbours that fill the first and last week. */
function weeksOf(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const first = Date.UTC(year, monthIndex - 1, 1);
  const last = Date.UTC(year, monthIndex, 0);
  const lead = (new Date(first).getUTCDay() + 1) % 7; // days back to Saturday
  const start = first - lead * DAY_MS;
  const weeks: string[][] = [];
  for (let day = start; day <= last || weeks.at(-1)?.length !== 7; day += DAY_MS) {
    if (!weeks.length || weeks.at(-1)!.length === 7) weeks.push([]);
    weeks.at(-1)!.push(iso(day));
  }
  return weeks;
}

/**
 * The month on the side (canvas: C · Month and day): Saturday first, a dot per
 * drive (amber when one still needs an outcome), today ringed, the chosen day
 * filled, closed weekdays muted. On a phone it folds to the chosen day's week
 * until the dealer asks for the whole month.
 */
export function MonthCalendar({
  month,
  selected,
  today,
  days,
  closedWeekdays,
  onSelect,
  onShift,
}: {
  month: string;
  selected: string;
  today: string;
  days: Record<string, { drives: number; needsOutcome: boolean }>;
  closedWeekdays: DayOfWeek[];
  onSelect: (date: string) => void;
  onShift: (delta: number) => void;
}) {
  const t = useTranslations("org.testDrives.month");
  const fmt = useFormatters();
  // Arabic short weekday names are the whole word; calendars head columns with one letter.
  const weekdayStyle = useLocale() === "ar" ? "narrow" : "short";
  const [expanded, setExpanded] = useState(false);
  const weeks = weeksOf(month);
  const [year, monthIndex] = month.split("-").map(Number);
  const title = fmt.date(Date.UTC(year, monthIndex - 1, 1), { month: "long", year: "numeric", day: undefined, timeZone: "UTC" });
  const selectedWeek = weeks.findIndex((week) => week.includes(selected));

  return (
    <section aria-labelledby="month-title" className="rounded-sheet border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 id="month-title" className="text-h3 font-extrabold">
          {title}
        </h2>
        <span className="flex gap-1.5">
          <button type="button" onClick={() => onShift(-1)} aria-label={t("previous")} className="flex size-9 cursor-pointer items-center justify-center rounded-control border border-[#8c8170] bg-field hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <ChevronLeft aria-hidden className="size-4 rtl:rotate-180" />
          </button>
          <button type="button" onClick={() => onShift(1)} aria-label={t("next")} className="flex size-9 cursor-pointer items-center justify-center rounded-control border border-[#8c8170] bg-field hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <ChevronRight aria-hidden className="size-4 rtl:rotate-180" />
          </button>
        </span>
      </div>

      <div role="grid" aria-labelledby="month-title" className="flex flex-col gap-1">
        <div role="row" className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((weekday, index) => (
            <span key={weekday} role="columnheader" className="py-1 text-center text-micro text-muted-foreground">
              {fmt.date(A_SATURDAY + index * DAY_MS, { weekday: weekdayStyle, day: undefined, month: undefined, year: undefined, timeZone: "UTC" })}
            </span>
          ))}
        </div>
        {weeks.map((week, weekIndex) => (
          <div key={week[0]} role="row" className={cn("grid grid-cols-7 gap-1", !expanded && weekIndex !== selectedWeek && "max-lg:hidden")}>
            {week.map((date, index) => {
              const info = days[date];
              const inMonth = date.startsWith(month);
              const closed = closedWeekdays.includes(WEEKDAYS[index]);
              const isSelected = date === selected;
              const label = [
                t("dayLabel", { date: fmt.date(`${date}T00:00:00Z`, { weekday: "long", day: "numeric", month: "long", year: undefined, timeZone: "UTC" }), count: info?.drives ?? 0, value: fmt.number(info?.drives ?? 0) }),
                info?.needsOutcome ? t("needsOutcome") : null,
                closed ? t("closed") : null,
              ]
                .filter(Boolean)
                .join(", ");
              return (
                <button
                  key={date}
                  type="button"
                  role="gridcell"
                  aria-label={label}
                  aria-selected={isSelected}
                  aria-current={date === today ? "date" : undefined}
                  onClick={() => onSelect(date)}
                  className={cn(
                    "flex h-12 cursor-pointer flex-col items-center justify-center rounded-control text-body font-semibold tabular-nums transition-colors",
                    "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    isSelected ? "bg-inverse text-inverse-foreground" : "hover:bg-muted",
                    date === today && !isSelected && "ring-2 ring-inset ring-border-strong",
                    (!inMonth || closed) && !isSelected && "font-normal text-muted-foreground/70",
                  )}
                >
                  {fmt.number(Number(date.slice(8)))}
                  <span aria-hidden className="mt-0.5 flex h-1.5 gap-0.5">
                    {Array.from({ length: Math.min(info?.drives ?? 0, 4) }).map((_, dot) => (
                      <i
                        key={dot}
                        className={cn(
                          "size-1.5 rounded-full",
                          info?.needsOutcome ? "bg-[#a87200]" : isSelected ? "bg-marker" : "bg-[#1d4e9e]",
                        )}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        className="mt-2 h-10 w-full cursor-pointer text-caption font-semibold text-[#1d4e9e] hover:underline lg:hidden"
      >
        {expanded ? t("showWeek") : t("showMonth")}
      </button>
      <p className="mt-3 text-micro text-muted-foreground max-lg:hidden">{t("legend")}</p>
    </section>
  );
}
