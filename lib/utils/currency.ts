/**
 * Currency formatting for AutoMe.
 *
 * AutoMe is Egypt-only and car prices are EGP. This exists so that fact lives in
 * one place: before it, eight call sites each built their own
 * Intl.NumberFormat with `currency: "USD"`, so every price in the product
 * rendered a dollar sign against a pound figure.
 *
 * Plan prices go through formatPlanAmount below: piasters, charged by Paymob.
 */

import type { Locale } from "@/i18n/routing";
import { intlLocale } from "./intl-locale";

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
 * The Arabic numbering system is decided in `intlLocale`, not here.
 */
export function formatCarPrice(
  amount: number,
  locale: Locale = "en",
  currency: string = CAR_CURRENCY
): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Currency plans are priced and charged in, through Paymob. */
export const PLAN_CURRENCY = "EGP";

/**
 * Format a plan price or a payment, given in piasters, the unit Paymob
 * charges in. Whole pounds show no decimals ("EGP 1,500"); a price with
 * piasters keeps them.
 */
export function formatPlanAmount(minor: number, locale: Locale = "en"): string {
  const major = minorToMajor(minor);
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: PLAN_CURRENCY,
    minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major);
}
