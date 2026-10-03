"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname } from "@/i18n/navigation";
import type { HeaderUser } from "./MainHeader";

/**
 * Who is looking at the site chrome, and what that entitles them to see.
 *
 * MainHeader and MobileMenu each derived this on their own, line for line;
 * the bottom tab bar would have been a third copy. One hook, one answer.
 */
export function useHeaderAccess(user: HeaderUser | undefined, organizationSlug?: string | null) {
  // Sign-out is a client event; `user` is the server's answer from the last
  // render, so a moment after signing out the prop still describes a member.
  // That is how the dashboard button came to sit beside "Sign in" — Clerk's
  // live state has to gate anything derived from the prop.
  //
  // While Clerk is still loading, the server's answer stands: a signed-out
  // visitor has no `user` to derive anything from anyway, so trusting it costs
  // nothing and spares a signed-in one a flicker.
  const { isLoaded, isSignedIn } = useAuth();
  const signedIn = !isLoaded || isSignedIn === true;
  const pathname = usePathname();

  const hasOrgMembership = signedIn && (user?.memberships?.length ?? 0) > 0;
  const isSuperAdmin = signedIn && user?.role === "ADMIN";
  // OWNER of any organization, or a platform ADMIN: these manage cars rather
  // than shop for them, so the buyer links (saved, messages) step aside.
  const isOwner =
    isSuperAdmin || (hasOrgMembership && !!user?.memberships?.some((m) => m.role === "OWNER"));

  const userOrgSlug = organizationSlug || user?.memberships?.[0]?.organization?.slug;
  const isOnAdminPath = !!pathname?.startsWith("/super-admin");
  const isOnOrgPath = !!pathname?.startsWith("/org/");

  return {
    signedIn,
    pathname,
    hasOrgMembership,
    isSuperAdmin,
    isOwner,
    isOnSubdomain: !!organizationSlug,
    isOnAdminPath,
    /** Org members and admins get a way into the dashboard, except from inside it. */
    showDashboardLink: (hasOrgMembership || isSuperAdmin) && !isOnOrgPath,
    dashboardHref: userOrgSlug ? `/org/${userOrgSlug}/dashboard` : "/super-admin",
    /** Members on their own subdomain see the admin nav instead of the shop nav. */
    showAdminNav: (hasOrgMembership || isSuperAdmin) && !!organizationSlug && !isOnAdminPath,
  };
}
