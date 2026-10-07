"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import TimeInput from "@/components/common/TimeInput";
import { useFormatters } from "@/hooks/use-formatters";
import { TimeRange } from "@/components/common/TimeRange";
import type { DayOfWeek } from "@/lib/generated/prisma";
import { cn } from "@/lib/utils";
import { SectionPanel } from "../../../_components/SectionPanel";
import { WEEK, type HoursState } from "./storefront-state";

/**
 * A time field reads left to right in both languages, like the clock it is.
 * Without this, an Arabic page right-aligns the digits while the ص/م chip sits
 * at the field’s left, so the two drift apart by however wide the time is.
 */
// No clock icon: the times are typed or stepped with the arrow keys, and the
// icon only crowded the ص/م mark in a narrow field.
const TIME_FIELD =
  "h-11 w-full rounded-control border-[#8c8170] bg-field text-left [direction:ltr] sm:w-32 [&::-webkit-calendar-picker-indicator]:hidden";
/** On a phone the two times share the row; from sm up each keeps its own width. */
const TIME_SLOT = "min-w-0 flex-1 sm:flex-none [&>span]:w-full";

/**
 * Opening hours as a week strip, Saturday to Friday: pick a day to edit it
 * below. One day at a time keeps the seven pairs of times from becoming a
 * wall of inputs, and "same hours for every open day" does the usual job of
 * setting the whole week in one go.
 */
export function HoursSection({
  hours,
  onChange,
  invalid,
}: {
  hours: HoursState;
  onChange: (next: HoursState) => void;
  invalid: DayOfWeek[];
}) {
  const t = useTranslations("org.settings.storefront.hours");
  const tDays = useTranslations("dealerships.days");
  const { clockTime } = useFormatters();
  const [selected, setSelected] = useState<DayOfWeek>("SATURDAY");
  const day = hours[selected];
  const setDay = (patch: Partial<HoursState[DayOfWeek]>) => onChange({ ...hours, [selected]: { ...day, ...patch } });
  const copyToOpenDays = () =>
    onChange(
      Object.fromEntries(
        WEEK.map((key) => [key, hours[key].isOpen ? { ...hours[key], openTime: day.openTime, closeTime: day.closeTime } : hours[key]]),
      ) as HoursState,
    );
  const dayInvalid = invalid.includes(selected);

  return (
    <SectionPanel title={t("title")} hint={t("hint")}>
      <div className="flex flex-col gap-4">
        <div role="group" aria-label={t("pickDay")} className="grid grid-cols-7 gap-1.5">
          {WEEK.map((key) => {
            const { isOpen, openTime, closeTime } = hours[key];
            const on = key === selected;
            const bad = invalid.includes(key);
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                aria-label={t("dayLabel", { day: tDays(key), hours: isOpen ? `${clockTime(openTime)} – ${clockTime(closeTime)}` : t("closed") })}
                onClick={() => setSelected(key)}
                className={cn(
                  "flex min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-2 text-center transition-colors",
                  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  on ? "border-2 border-border-strong bg-marker-soft" : isOpen ? "border-[#8c8170] bg-field hover:bg-muted" : "border-border bg-muted text-muted-foreground",
                  bad && "border-2 border-destructive",
                )}
              >
                {/* A phone fits one letter of an Arabic day name; wider screens the short name and the hours. */}
                <span className="text-caption font-bold sm:hidden">{t(`narrow.${key}`)}</span>
                <span className="hidden text-caption font-bold sm:block">{t(`short.${key}`)}</span>
                <span className="hidden text-micro leading-tight sm:block">
                  {isOpen ? <TimeRange start={openTime} end={closeTime} /> : t("closed")}
                </span>
                {/* On a phone the strip is too narrow for times; a dash marks a closed day. */}
                <span className="text-micro leading-tight sm:hidden">{isOpen ? "" : "–"}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-field p-3.5 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="flex min-h-11 cursor-pointer items-center gap-3">
            <Switch
              checked={day.isOpen}
              onCheckedChange={(isOpen) => setDay({ isOpen })}
              className="h-6 w-10 data-[state=checked]:bg-inverse [&>span]:size-5"
            />
            <span className="font-semibold">{tDays(selected)}</span>
            {!day.isOpen && <span className="text-caption text-muted-foreground">{t("closed")}</span>}
          </label>

          {day.isOpen && (
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-caption text-muted-foreground">{t("from")}</span>
              <span className={TIME_SLOT}>
                <TimeInput
                  id="sf-opens"
                  value={day.openTime}
                  onChange={(openTime) => setDay({ openTime })}
                  className={TIME_FIELD}
                />
              </span>
              <span className="text-caption text-muted-foreground">{t("to")}</span>
              <span className={TIME_SLOT}>
                <TimeInput
                  id="sf-closes"
                  value={day.closeTime}
                  onChange={(closeTime) => setDay({ closeTime })}
                  className={cn(TIME_FIELD, dayInvalid && "border-2 border-destructive")}
                />
              </span>
            </div>
          )}

          {day.isOpen && (
            <Button
              variant="outline-strong"
              size="control"
              className="h-11 border bg-field sm:ms-auto"
              onClick={copyToOpenDays}
            >
              <Copy aria-hidden />
              {t("copy")}
            </Button>
          )}

          {dayInvalid && (
            <p role="alert" className="w-full text-micro font-semibold text-destructive">
              {t("invalid")}
            </p>
          )}
        </div>
      </div>
    </SectionPanel>
  );
}
