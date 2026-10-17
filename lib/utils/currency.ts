import type { Locale } from "@/i18n/routing";
import { intlLocale } from "./intl-locale";

/** Currency of record for car prices. Car.priceCurrency defaults to this. */
export const CAR_CURRENCY = "EGP";

export function minorToMajor(minor: number): number {
  return minor / 100;
}

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

export function formatPlanAmount(minor: number, locale: Locale = "en"): string {
  const major = minorToMajor(minor);
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: PLAN_CURRENCY,
    minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major);
}
