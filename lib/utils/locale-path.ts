import { routing } from "@/i18n/routing";

/**
 * Locale-prefix helpers for the middleware chain.
 *
 * These live outside `middleware.ts` so they can be tested without importing
 * Arcjet and Clerk. That matters more than usual here: every mistake in this
 * file is silent. A route matcher that stops matching does not throw — the
 * route just quietly stops being protected.
 */

const LOCALE_SEGMENT = `(${routing.locales.join("|")})`;
const LEADING_LOCALE = new RegExp(`^/${LOCALE_SEGMENT}(?=/|$)`);

/**
 * Expand route patterns to match both the prefixed and unprefixed forms.
 *
 * Once every page URL carries a locale, a matcher written as
 * `/super-admin(.*)` matches nothing on `/en/super-admin`. The unprefixed form
 * is still needed because matchers run on the request as it arrives, before the
 * intl redirect has had a chance to add the prefix.
 */
export function localized(paths: string[]): string[] {
  return paths.flatMap((p) => [p, `/${LOCALE_SEGMENT}${p}`]);
}

/** Strip a leading locale segment: "/en/cars" -> "/cars", "/en" -> "/". */
export function pathnameWithoutLocale(pathname: string): string {
  const match = LEADING_LOCALE.exec(pathname);
  return match ? pathname.slice(match[0].length) || "/" : pathname;
}

/**
 * The locale a request is already on, for building locale-preserving redirects.
 * Falls back to the default locale for paths that carry no prefix.
 */
export function localeOf(pathname: string): string {
  return LEADING_LOCALE.exec(pathname)?.[1] ?? routing.defaultLocale;
}
