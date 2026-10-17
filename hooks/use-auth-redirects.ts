"use client";

import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";

export function useAuthRedirects() {
  const locale = useLocale();
  // Locale-free, as `@/i18n/navigation` reports it: "/cars/abc".
  const pathname = usePathname();

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
    signIn: signInTo(pathname),
  };
}
