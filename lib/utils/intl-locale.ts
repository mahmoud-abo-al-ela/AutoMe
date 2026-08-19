import type { Locale } from "@/i18n/routing";

/**
 * The single place the numbering system is decided.
 *
 * `Intl.NumberFormat("ar-EG")` renders Eastern Arabic numerals (٠١٢٣) by
 * default, but Egyptian commerce — prices, mileage, dates on a listing —
 * overwhelmingly uses Western digits. The `-u-nu-latn` extension forces them.
 *
 * This surprises everyone exactly once, which is why it lives in one function
 * instead of being repeated at each formatter. Changing this line changes every
 * number and date in the product; there is no second place to remember.
 *
 * The region is pinned to EG on both locales so that date order, separators and
 * the currency symbol come from the market rather than from the language.
 */
export function intlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-EG-u-nu-latn" : "en-EG";
}

/**
 * Egypt is a single timezone, but not a single offset: DST was reinstated in
 * 2023, so Africa/Cairo shifts against UTC twice a year. Always format and do
 * slot arithmetic in the named zone — never store or assume "+02:00".
 */
export const APP_TIME_ZONE = "Africa/Cairo";
