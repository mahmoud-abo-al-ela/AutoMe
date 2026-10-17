import type { Locale } from "@/i18n/routing";
import { intlLocale } from "./intl-locale";

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
