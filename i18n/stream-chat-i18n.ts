import { Streami18n, enTranslations } from "stream-chat-react";
import { formatDateTime, formatMessageTimestamp } from "@/lib/utils/datetime";
import { formatNumber } from "@/lib/utils/number";
import { APP_TIME_ZONE } from "@/lib/utils/intl-locale";
import type { Locale } from "./routing";
import arTranslations from "./stream-chat-ar.json";

type StreamI18nOptions = NonNullable<ConstructorParameters<typeof Streami18n>[0]>;
type DayjsLocaleConfig = NonNullable<
  StreamI18nOptions["dayjsLocaleConfigForLanguage"]
>;

const AR_DAYJS_LOCALE = {
  name: "ar",
  weekdays: "الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),
  weekdaysShort: "أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت".split("_"),
  weekdaysMin: "ح_ن_ث_ر_خ_ج_س".split("_"),
  months:
    "يناير_فبراير_مارس_أبريل_مايو_يونيو_يوليو_أغسطس_سبتمبر_أكتوبر_نوفمبر_ديسمبر".split(
      "_"
    ),
  monthsShort:
    "يناير_فبراير_مارس_أبريل_مايو_يونيو_يوليو_أغسطس_سبتمبر_أكتوبر_نوفمبر_ديسمبر".split(
      "_"
    ),
  // Egypt's week starts on Saturday — the weekend is Friday–Saturday.
  weekStart: 6,
  ordinal: (n: number) => n,
  formats: {
    LT: "HH:mm",
    LTS: "HH:mm:ss",
    L: "D/‏M/‏YYYY",
    LL: "D MMMM YYYY",
    LLL: "D MMMM YYYY HH:mm",
    LLLL: "dddd D MMMM YYYY HH:mm",
  },
  calendar: {
    sameDay: "[اليوم الساعة] LT",
    nextDay: "[غدًا الساعة] LT",
    nextWeek: "dddd [الساعة] LT",
    lastDay: "[أمس الساعة] LT",
    lastWeek: "[آخر] dddd [الساعة] LT",
    sameElse: "L",
  },
  relativeTime: {
    future: "بعد %s",
    past: "منذ %s",
    s: "ثانية واحدة",
    m: "دقيقة واحدة",
    mm: "%d دقائق",
    h: "ساعة واحدة",
    hh: "%d ساعات",
    d: "يوم واحد",
    dd: "%d أيام",
    M: "شهر واحد",
    MM: "%d أشهر",
    y: "عام واحد",
    yy: "%d أعوام",
  },
  // dayjs reads `meridiem` at runtime but its published ILocale type omits it.
  meridiem: (hour: number) => (hour > 12 ? "م" : "ص"),
} as unknown as DayjsLocaleConfig;

function formatters(locale: Locale): StreamI18nOptions["formatters"] {
  return {
    timestampFormatter: () => (value, _lng, options) =>
      options.calendar
        ? formatMessageTimestamp(value as string | Date, locale)
        : formatDateTime(value as string | Date, locale),
    // Reached as `{{ count | number }}`, Stream's interpolation separator
    // being "|". Without it a plural renders its own label in Arabic numerals
    // and its count in Western ones.
    number: () => (value: unknown) => formatNumber(Number(value), locale),
  };
}

export function createStreamI18n(locale: Locale) {
  const isArabic = locale === "ar";

  return new Streami18n({
    language: locale,
    ...(isArabic
      ? {
          translationsForLanguage: { ...enTranslations, ...arTranslations },
          dayjsLocaleConfigForLanguage: AR_DAYJS_LOCALE,
        }
      : {}),
    formatters: formatters(locale),
    // Stream would otherwise format timestamps in the reader's own zone, so a
    // dealer travelling abroad would see a message sent at 9am Cairo stamped
    // with their local hour. Egypt observes DST, hence the named zone.
    timezone: APP_TIME_ZONE,
    // Last resort, for a key the library added after this bundle was
    // merged: the key itself is readable English, except for the namespaced
    // ones, where it would read "aria/Send".
    parseMissingKeyHandler: (key: string) => key.replace(/^[a-z]+\//, ""),
  });
}
