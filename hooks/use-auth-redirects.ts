"use client";

import { useLocale } from "next-intl";

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

  return {
    /** Where Clerk lands after a successful sign-in or sign-up. */
    afterSignIn: `/${locale}/auth-redirect`,
    /** Where Clerk lands after signing out: the reader's own home page. */
    afterSignOut: `/${locale}`,
  };
}
