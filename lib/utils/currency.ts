/**
 * Currency formatting for AutoMe.
 *
 * AutoMe is Egypt-only and car prices are EGP. This exists so that fact lives in
 * one place: before it, eight call sites each built their own
 * Intl.NumberFormat with `currency: "USD"`, so every price in the product
 * rendered a dollar sign against a pound figure.
 *
 * Plan/subscription prices are EGP too, as of the move off the USD peg — see
 * `formatPlanPrice` below and `PLAN_CURRENCY` in lib/services/stripe/plan.ts,
 * which must agree with it or the product shows one currency and Stripe charges
 * another.
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
 * Format a major-unit EGP amount for display.
 *
 * The `-u-nu-latn` on the Arabic locale is deliberate: Intl.NumberFormat("ar-EG")
 * renders Eastern Arabic numerals (٠١٢٣) by default, and Egyptian commerce
 * writes prices in Western digits.
 */
export function formatCarPrice(
  amount: number,
  locale: "en" | "ar" = "en"
): string {
  return new Intl.NumberFormat(
    locale === "ar" ? "ar-EG-u-nu-latn" : "en-EG",
    {
      style: "currency",
      currency: CAR_CURRENCY,
      maximumFractionDigits: 0,
    }
  ).format(amount);
}

/**
 * Format a plan price for display.
 *
 * Takes **minor units** (`Plan.monthlyPrice` / `Plan.yearlyPrice` are stored
 * that way) and converts, so no call site does its own `/ 100`. Every plan
 * price in the product — onboarding, org billing, super-admin — goes through
 * here, and it must stay in step with `PLAN_CURRENCY` in
 * lib/services/stripe/plan.ts, which is what Stripe actually charges.
 */
export function formatPlanPrice(
  minorUnits: number,
  locale: "en" | "ar" = "en"
): string {
  return formatCarPrice(minorToMajor(minorUnits), locale);
}
