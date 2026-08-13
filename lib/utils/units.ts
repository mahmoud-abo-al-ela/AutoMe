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

/**
 * Format a car's mileage for display.
 *
 * The `-u-nu-latn` on the Arabic locale matches `formatCarPrice`: Intl renders
 * Eastern Arabic numerals for "ar-EG" by default, and Egyptian listings use
 * Western digits.
 */
export function formatMileage(
  mileage: number,
  locale: "en" | "ar" = "en"
): string {
  return new Intl.NumberFormat(
    locale === "ar" ? "ar-EG-u-nu-latn" : "en-EG",
    {
      style: "unit",
      unit: "kilometer",
      unitDisplay: "short",
      maximumFractionDigits: 0,
    }
  ).format(mileage || 0);
}
