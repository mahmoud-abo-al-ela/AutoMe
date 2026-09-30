import { Streami18n, enTranslations } from "stream-chat-react";
import { formatDateTime, formatMessageTimestamp } from "@/lib/utils/datetime";
import { formatNumber } from "@/lib/utils/number";
import { APP_TIME_ZONE } from "@/lib/utils/intl-locale";
import type { Locale } from "./routing";
import arTranslations from "./stream-chat-ar.json";

/**
 * Stream Chat ships its own translation bundle — eleven languages, none of them
 * Arabic — so its UI stays English however the rest of the page is set. This is
 * the Clerk-shaped problem again: a vendor's copy, translated through the
 * vendor's own mechanism rather than through next-intl.
 *
 * Its keys ARE the English sentences, so anything `stream-chat-ar.json` does
 * not cover renders in English rather than as a raw key. That is the intended
 * fallback for the features this product does not enable — polls, live
 * location, voice recording, AI generation — which is most of what is missing.
 * `i18n/chat-messages.test.ts` guards the other direction: a key we translated
 * that the library no longer has would fall back forever without anyone
 * noticing.
 */

type StreamI18nOptions = NonNullable<ConstructorParameters<typeof Streami18n>[0]>;
type DayjsLocaleConfig = NonNullable<
  StreamI18nOptions["dayjsLocaleConfigForLanguage"]
>;

/**
 * Stream formats dates with dayjs, which has no Arabic locale loaded until
 * something registers one.
 *
 * `import "dayjs/locale/ar"` is the documented way and does not work here:
 * dayjs is a transitive dependency of stream-chat-react, so under pnpm's
 * strict layout this package cannot import from it. Streami18n's other
 * supported route is to hand it the locale config, which it merges over the
 * English one — so anything omitted below still resolves.
 *
 * This is the fallback path. Everything Stream renders through a
 * `timestamp/…` translation key goes through the formatters below instead,
 * which use the app's own helpers. Digits here stay Western: dayjs applies a
 * locale's `postformat` only with a plugin this build does not extend, which
 * is the other half of why the formatters exist.
 */
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

/**
 * Formatters replace the dayjs and raw-number paths with the app's own
 * helpers, so a timestamp inside the message list reads the same as one in the
 * channel list beside it — same zone, same phrasing, and the same numerals.
 *
 * Arabic renders Eastern digits, but only under `ar-EG`; bare `ar` is `latn`,
 * and `lng` here is the bare tag. Both of these pass the app locale through
 * `intlLocale` rather than trusting it. See lib/utils/intl-locale.
 */
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
          // Layered over the English bundle rather than replacing it, so an
          // untranslated key keeps its real English value. Several of them
          // are not sentences at all but formatter templates — the
          // "timestamp/…" and "duration/…" keys — which have to survive
          // intact or the component renders the key name where a date goes.
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
