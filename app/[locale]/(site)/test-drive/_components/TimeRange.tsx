"use client";

import { useFormatters } from "@/hooks/use-formatters";

/**
 * A clock-time range, localized and bidi-isolated.
 *
 * `start` and `end` are the raw "HH:mm" strings the columns hold; they are
 * formatted here so an Arabic reader gets "٩:٠٠ ص" rather than a bare "09:00"
 * sitting in Latin digits next to an otherwise Arabic line.
 *
 * `dir="auto"` rather than a fixed direction: the formatted range is Latin in
 * English and Arabic in Arabic, so the correct direction depends on the locale.
 * Letting the first strong character decide gets both right, while still
 * isolating the range from the surrounding text — without isolation the two
 * times and the neutral dash reorder, and a slot reads as though it finishes
 * before it starts.
 */
export const TimeRange = ({ start, end }: { start: string; end: string }) => {
  const { clockTime } = useFormatters();

  return (
    <span dir="auto">
      {clockTime(start)} – {clockTime(end)}
    </span>
  );
};

export default TimeRange;
