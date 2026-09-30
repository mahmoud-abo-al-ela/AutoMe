"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";

/**
 * Post-authentication destinations, carrying the locale.
 *
 * Clerk's `forceRedirectUrl`, `afterSignOutUrl` and `signOut({ redirectUrl })`
 * take plain strings that Clerk navigates to itself. They never pass through
 * `@/i18n/navigation`, so nothing localizes them — and because routing.ts sets
 * `localePrefix: "always"` with `localeDetection: false`, an unprefixed path
 * can only resolve to the default locale. A hardcoded "/auth-redirect" is
 * therefore a 308 to `/en/auth-redirect`, where `getLocale()` reads "en" and
 * every redirect after it continues in English: signing in on an Arabic page
 * dropped the reader into the English tree for the rest of the session.
 *
 * The locale has to be put back by hand, and it is easy to miss one of these —
 * there were nine — so they live here rather than inline at each call site.
 */
export function useAuthRedirects() {
  const locale = useLocale();
  // Locale-free, as `@/i18n/navigation` reports it: "/cars/abc".
  const pathname = usePathname();

  /**
   * The sign-in page, told to come back to `path` (locale-free, may carry a
   * query) — for a click that means "do this after signing in", like opening
   * a car's chat, where coming back to the bare page would drop the intent.
   */
  const signInTo = (path: string) => ({
    pathname: "/sign-in" as const,
    query: { redirect_url: `/${locale}${path === "/" ? "" : path}` },
  });

  return {
    signInTo,
    /** Where Clerk lands after a successful sign-in or sign-up. */
    afterSignIn: `/${locale}/auth-redirect`,
    /** Where Clerk lands after signing out: the reader's own home page. */
    afterSignOut: `/${locale}`,
    /**
     * The sign-in page, told to bring the reader back here afterwards. Without
     * `redirect_url` the sign-in page can only fall back to the locale home,
     * so signing in from a car page lost the car. The return path carries the
     * locale because Clerk navigates to it directly, outside next-intl.
     */
    signIn: signInTo(pathname),
  };
}
