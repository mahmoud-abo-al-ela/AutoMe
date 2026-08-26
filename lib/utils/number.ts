/**
 * Plain-number formatting for AutoMe.
 *
 * This exists for the same reason as `currency.ts` and `units.ts`: without it,
 * every result count, stat tile and chart tooltip reached for a bare
 * `value.toLocaleString()`. That is not locale-aware in the way it looks — it
 * uses the *runtime's* default locale, which on the server is whatever the host
 * is configured for and in the browser is the user's OS setting. Neither is the
 * locale the page is being rendered in, so an Arabic page could group digits
 * one way and an English page another, on the same machine, for the same number.
 *
 * It also bypassed `intlLocale`, which is the one place the numbering system
 * is decided — so counts rendered in a different numeral system to the prices
 * beside them.
 *
 * The Arabic numbering system is decided in `intlLocale`, not here.
 */

import type { Locale } from "@/i18n/routing";
import { intlLocale } from "./intl-locale";

/**
 * Format an integer count for display — result totals, stat values, pagination.
 *
 * Fraction digits are pinned to zero because every current caller is a count.
 * Pass `options` for the cases that are not.
 */
export function formatNumber(
  value: number,
  locale: Locale = "en",
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    maximumFractionDigits: 0,
    ...options,
  }).format(value || 0);
}
