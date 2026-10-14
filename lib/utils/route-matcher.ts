import { pathnameWithoutLocale } from "./locale-path";

/**
 * The middleware's path matching, in place of Clerk's createRouteMatcher
 * (deprecated in Clerk 7, removed in the next major). It understands only the
 * two pattern forms lib/route-policy uses:
 *
 * - `/org(.*)` — the path and anything that starts with it. As greedy as the
 *   Clerk matcher was: `/org-chart` matches too, which errs toward guarding
 *   more, never less.
 * - `/dealerships` — that path alone, with or without a trailing slash.
 *
 * Case-insensitive and blind to repeated slashes (`/en//org`), as Clerk's was.
 * Middleware matching only routes a request (a sign-in redirect, a storefront
 * redirect); every page, action and route handler that reads private data
 * still checks the session itself.
 */

const PREFIX = "(.*)";

export type PathMatcher = (pathname: string) => boolean;

export function pathMatcher(patterns: readonly string[]): PathMatcher {
  const prefixes: string[] = [];
  const exact = new Set<string>();
  for (const pattern of patterns) {
    if (pattern.endsWith(PREFIX)) prefixes.push(pattern.slice(0, -PREFIX.length).toLowerCase());
    else exact.add(withoutTrailingSlash(pattern.toLowerCase()));
  }
  return (pathname) => {
    const path = normalize(pathname);
    return exact.has(withoutTrailingSlash(path)) || prefixes.some((prefix) => path.startsWith(prefix));
  };
}

/** The same, for page routes: matches with or without a leading locale. */
export function localizedPathMatcher(patterns: readonly string[]): PathMatcher {
  const matches = pathMatcher(patterns);
  return (pathname) => matches(pathnameWithoutLocale(normalize(pathname)));
}

function normalize(pathname: string): string {
  return pathname.toLowerCase().replace(/\/{2,}/g, "/");
}

function withoutTrailingSlash(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}
