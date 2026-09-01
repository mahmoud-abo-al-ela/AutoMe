"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import {
  formatClockTime,
  formatDate,
  formatDateTime,
  formatMessageTimestamp,
  formatPattern,
  formatRelativeToNow,
  formatTime,
} from "@/lib/utils/datetime";
import { formatCarPrice } from "@/lib/utils/currency";
import { formatMileage } from "@/lib/utils/units";
import { formatNumber } from "@/lib/utils/number";

/**
 * Locale-bound formatters for client components.
 *
 * The underlying helpers all take the locale explicitly so they work on the
 * server too. This binds the active one once, so a component never has to
 * thread `locale` down through props — which is how the previous "en-US"
 * hardcodes accumulated: passing it was inconvenient, so nobody did.
 */
export function useFormatters() {
  const locale = useLocale() as Locale;

  return useMemo(
    () => ({
      locale,
      date: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
        formatDate(value, locale, options),
      time: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
        formatTime(value, locale, options),
      /** A bare "HH:mm" clock string, not an instant. See formatClockTime. */
      clockTime: (value: string) => formatClockTime(value, locale),
      dateTime: (value: Date | string | number, options?: Intl.DateTimeFormatOptions) =>
        formatDateTime(value, locale, options),
      pattern: (value: Date | string | number, pattern: string) =>
        formatPattern(value, pattern, locale),
      relativeToNow: (
        value: Date | string | number,
        options?: { addSuffix?: boolean }
      ) => formatRelativeToNow(value, locale, options),
      messageTimestamp: (value: Date | string | null | undefined) =>
        formatMessageTimestamp(value, locale),
      price: (amount: number, currency?: string) =>
        formatCarPrice(amount, locale, currency),
      mileage: (value: number) => formatMileage(value, locale),
      number: (value: number, options?: Intl.NumberFormatOptions) =>
        formatNumber(value, locale, options),
    }),
    [locale]
  );
}
