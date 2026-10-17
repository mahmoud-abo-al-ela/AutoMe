import type { Locale } from "@/i18n/routing";
import { intlLocale } from "./intl-locale";

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
