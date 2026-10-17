import type { Locale } from "@/i18n/routing";

export function intlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-EG" : "en-EG";
}

export const APP_TIME_ZONE = "Africa/Cairo";
