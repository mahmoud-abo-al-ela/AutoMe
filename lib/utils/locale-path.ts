import { routing } from "@/i18n/routing";

const LOCALE_SEGMENT = `(${routing.locales.join("|")})`;
const LEADING_LOCALE = new RegExp(`^/${LOCALE_SEGMENT}(?=/|$)`);

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

const DASHBOARD_PATH = /^\/org\/([^/?#]+)/;

export function dashboardSlugOf(pathname: string): string | null {
  const match = DASHBOARD_PATH.exec(pathnameWithoutLocale(pathname));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    // A malformed escape names no dealership.
    return null;
  }
}
