/**
 * Currency formatting for AutoMe.
 *
 * AutoMe is Egypt-only and car prices are EGP. This exists so that fact lives in
 * one place: before it, eight call sites each built their own
 * Intl.NumberFormat with `currency: "USD"`, so every price in the product
 * rendered a dollar sign against a pound figure.
 *
 * NOTE: plan/subscription prices are deliberately NOT formatted through here.
 * Stripe charges those in USD (lib/services/stripe/plan.ts), so displaying them
 * as EGP would misstate what the customer is billed. Whether plan pricing
 * should move to EGP is a business decision, not a formatting one.
 */

/** Currency of record for car prices. Car.priceCurrency defaults to this. */
export const CAR_CURRENCY = "EGP";

/**
 * Minor units (piastres) → major units (pounds).
 *
 * Routed through a helper rather than a bare `/ 100` so the exponent is stated
 * once. EGP has 100 minor units; several currencies do not, which is what makes
 * a scattered `/ 100` expensive to undo later.
 */
export function minorToMajor(minor: number): number {
  return minor / 100;
}

/**
 * Format a major-unit car price for display.
 *
 * `currency` comes from the listing's own `Car.priceCurrency`, not from a global
 * assumption. It defaults to EGP for the many call sites that format a bare
 * number (filter chips, price-range labels) where there is no row to read.
 *
 * The `-u-nu-latn` on the Arabic locale is deliberate: Intl.NumberFormat("ar-EG")
 * renders Eastern Arabic numerals (٠١٢٣) by default, and Egyptian commerce
 * writes prices in Western digits.
 */
export function formatCarPrice(
  amount: number,
  locale: "en" | "ar" = "en",
  currency: string = CAR_CURRENCY
): string {
  return new Intl.NumberFormat(
    locale === "ar" ? "ar-EG-u-nu-latn" : "en-EG",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }
  ).format(amount);
}
