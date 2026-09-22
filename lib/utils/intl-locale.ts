import type { Locale } from "@/i18n/routing";

/**
 * The single place the numbering system is decided.
 *
 * Arabic renders Eastern Arabic numerals (٠١٢٣) — this is `ar-EG` with no
 * `-u-nu-latn` override, so the numbering system comes from the locale.
 *
 * This was previously forced to Western digits, on the reasoning that Egyptian
 * commerce writes prices in them. That was overridden as a product decision
 * (2026-08-26): the Arabic UI uses Arabic numerals throughout. Reverting is a
 * one-line change back to `ar-EG-u-nu-latn`, plus the digit assertions in
 * datetime.test.ts.
 *
 * Changing this line changes every number, price and date in the product; there
 * is no second place to remember.
 *
 * ⚠️ This governs `Intl` only. Numbers rendered *inside* an ICU message are
 * formatted by next-intl against the bare `ar` tag, whose default numbering
 * system is `latn` — so a message that displays a raw numeric argument will
 * disagree with this function. Display numbers are therefore passed into
 * messages already formatted (see `useFormatters().number`), with the raw
 * number kept only where a plural category has to be selected.
 *
 * The region is pinned to EG on both locales so that date order, separators and
 * the currency symbol come from the market rather than from the language.
 */
export function intlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-EG" : "en-EG";
}

/**
 * Egypt is a single timezone, but not a single offset: DST was reinstated in
 * 2023, so Africa/Cairo shifts against UTC twice a year. Always format and do
 * slot arithmetic in the named zone — never store or assume "+02:00".
 */
export const APP_TIME_ZONE = "Africa/Cairo";
