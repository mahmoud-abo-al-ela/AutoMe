import { isLocale, routing, type Locale } from "@/i18n/routing";

/**
 * The language of the page Paymob returns a buyer to, as the page that started
 * the checkout sent it.
 *
 * Server Actions pass it in rather than reading it with next-intl's
 * `getLocale()`: that reads Next's root params, which Next 15 refuses inside a
 * Server Action ("`import('next/root-params').locale()` was used inside a
 * Server Action"), and every billing checkout failed in production with it.
 * Anything that is not one of our locales falls back to the default; the value
 * only picks a language, never what is charged.
 */
export function returnLocale(value: unknown): Locale {
  return typeof value === "string" && isLocale(value) ? value : routing.defaultLocale;
}
