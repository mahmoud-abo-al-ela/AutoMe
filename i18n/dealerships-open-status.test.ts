import { describe, it, expect } from "vitest";
import { createTranslator } from "next-intl";
import { getOpenStatus } from "@/lib/utils/open-status";
import { formatClockTime } from "@/lib/utils/datetime";
import type { OpenStatus } from "@/lib/utils/open-status";
import type { Locale } from "@/i18n/routing";
import type { DayOfWeek } from "@/lib/generated/prisma";
import type { WorkingHoursEntry } from "@/lib/utils/working-hours";
import en from "@/messages/en/dealerships.json";
import ar from "@/messages/ar/dealerships.json";

/**
 * The open/closed sentence is assembled from three separate pieces — a status
 * key from lib/utils/open-status, a day name from the message bundle, and a
 * clock face from formatClockTime. Nothing type-checks that they fit together,
 * and the page that renders them fetches client-side, so it is invisible to an
 * HTTP-level check.
 *
 * This asserts the composition end to end, in both locales, without React.
 */

const messages = { en, ar };

/** The wording half of useOpenStatusMessage, without the hook. */
const describeStatus = (status: OpenStatus, locale: Locale) => {
  const t = createTranslator({
    locale,
    messages: { dealerships: messages[locale] },
    namespace: "dealerships",
  });

  return t(`openStatus.${status.statusKey}`, {
    time: status.params?.time
      ? formatClockTime(status.params.time, locale)
      : "",
    day: status.params?.day ? t(`days.${status.params.day}`) : "",
  });
};

const day = (
  dayKey: DayOfWeek,
  openTime: string,
  closeTime: string,
  isOpen = true
): WorkingHoursEntry => ({ dayKey, openTime, closeTime, isOpen });

const WEEKDAYS_ONLY: WorkingHoursEntry[] = [
  day("SATURDAY", "09:00", "17:00", false),
  day("SUNDAY", "09:00", "17:00"),
  day("MONDAY", "09:00", "17:00"),
  day("TUESDAY", "09:00", "17:00"),
  day("WEDNESDAY", "09:00", "17:00"),
  day("THURSDAY", "09:00", "17:00"),
  day("FRIDAY", "09:00", "17:00", false),
];

describe("the open-status sentence", () => {
  it("names the closing time in English", () => {
    const now = new Date("2026-01-15T10:00:00Z"); // 12:00 Cairo, Thursday
    const status = getOpenStatus(WEEKDAYS_ONLY, now);

    expect(describeStatus(status, "en")).toBe("Closes at 5:00 PM");
  });

  it("names the closing time in Arabic, in Eastern digits", () => {
    const now = new Date("2026-01-15T10:00:00Z");
    const status = getOpenStatus(WEEKDAYS_ONLY, now);

    const message = describeStatus(status, "ar");

    expect(message).toContain("يغلق الساعة");
    // Eastern Arabic numerals, per the Egypt-only product decision.
    expect(message).toMatch(/[٠-٩]/);
    expect(message).not.toMatch(/[0-9]/);
  });

  it("names the next open day when the weekend intervenes", () => {
    const now = new Date("2026-01-15T16:00:00Z"); // 18:00 Cairo, Thursday
    const status = getOpenStatus(WEEKDAYS_ONLY, now);

    expect(status.statusKey).toBe("opensOnDayAt");
    expect(describeStatus(status, "en")).toBe("Opens Sunday at 9:00 AM");
    expect(describeStatus(status, "ar")).toBe("يفتح الأحد الساعة ٩:٠٠ ص");
  });

  it("says tomorrow rather than naming the day, when it is tomorrow", () => {
    const now = new Date("2026-01-14T16:00:00Z"); // 18:00 Cairo, Wednesday

    expect(describeStatus(getOpenStatus(WEEKDAYS_ONLY, now), "en")).toBe(
      "Opens tomorrow at 9:00 AM"
    );
    expect(describeStatus(getOpenStatus(WEEKDAYS_ONLY, now), "ar")).toBe(
      "يفتح غدًا الساعة ٩:٠٠ ص"
    );
  });

  it("leaves no placeholder unfilled for any reachable status", () => {
    const statuses: OpenStatus[] = [
      { isOpen: false, statusKey: "unavailable" },
      { isOpen: false, statusKey: "closed" },
      { isOpen: true, statusKey: "closesAt", params: { time: "17:00" } },
      { isOpen: false, statusKey: "opensAt", params: { time: "09:00" } },
      {
        isOpen: false,
        statusKey: "opensTomorrowAt",
        params: { time: "09:00" },
      },
      {
        isOpen: false,
        statusKey: "opensOnDayAt",
        params: { time: "09:00", day: "SUNDAY" },
      },
    ];

    for (const locale of ["en", "ar"] as const) {
      for (const status of statuses) {
        const message = describeStatus(status, locale);

        expect(message).not.toContain("{");
        expect(message.trim()).not.toBe("");
      }
    }
  });

  it("translates every day the working-hours list can emit", () => {
    const days: DayOfWeek[] = [
      "SATURDAY",
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
    ];

    for (const dayKey of days) {
      expect(en.days[dayKey]).toBeTruthy();
      expect(ar.days[dayKey]).toBeTruthy();
      // An untranslated Arabic day would be a copy of the English one.
      expect(ar.days[dayKey]).not.toBe(en.days[dayKey]);
    }
  });
});
