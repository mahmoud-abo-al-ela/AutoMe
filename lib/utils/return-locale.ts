import { isLocale, routing, type Locale } from "@/i18n/routing";

export function returnLocale(value: unknown): Locale {
  return typeof value === "string" && isLocale(value) ? value : routing.defaultLocale;
}
