import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

/** Writing direction per locale. Drives `<html dir>` and Radix's DirectionProvider. */
export const localeDirection = {
  en: "ltr",
  ar: "rtl",
} as const satisfies Record<Locale, "ltr" | "rtl">;

/** Native-name labels for the language switcher. Never translated. */
export const localeLabels = {
  en: "English",
  ar: "العربية",
} as const satisfies Record<Locale, string>;

export function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

export function localizedPath(locale: Locale, path: string): string {
  return `/${locale}${path}`;
}
