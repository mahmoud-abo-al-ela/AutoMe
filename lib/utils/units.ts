/**
 * Unit formatting for AutoMe.
 *
 * AutoMe is Egypt-only, so distances are kilometres. This exists for the same
 * reason as `currency.ts`: before it, four call sites each hardcoded a "mi"
 * suffix (or `style: "unit", unit: "mile"`) against numbers dealers enter in
 * kilometres, so every mileage in the product was labelled with the wrong unit.
 *
 * `Car.mileage` is a plain Int with no unit column — the unit is a product
 * decision, recorded here rather than repeated at each render site.
 */

import type { Locale } from "@/i18n/routing";
import { intlLocale } from "./intl-locale";

/**
 * Format a car's mileage for display.
 *
 * The Arabic numbering system is decided in `intlLocale`, not here.
 */
export function formatMileage(
  mileage: number,
  locale: Locale = "en"
): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "unit",
    unit: "kilometer",
    unitDisplay: "short",
    maximumFractionDigits: 0,
  }).format(mileage || 0);
}
