import { defineRouting } from "next-intl/routing";

/**
 * AutoMe serves Egypt in Arabic and English.
 *
 * `localePrefix: "always"` is deliberate. Leaving the default locale unprefixed
 * makes canonical and hreflang URLs ambiguous — the same page becomes reachable
 * at both `/cars` and `/en/cars`, and search engines have to guess which is
 * canonical. Prefixing both keeps one URL per locale per page.
 *
 * `localeDetection: false` is also deliberate, and is the rule most likely to be
 * "fixed" back by someone who assumes detection is a feature. Auto-redirecting
 * on Accept-Language breaks shared links, traps users whose browser language is
 * not the language they want to read, and — because Googlebot crawls
 * predominantly from US IPs — can mean the Arabic pages are never indexed at
 * all. Language is suggested via a dismissible banner and persisted in a cookie;
 * the URL always wins.
 */
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
