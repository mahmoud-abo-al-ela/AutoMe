"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname } from "@/i18n/navigation";
import { plateBandFor, showsDealerPitch } from "@/lib/org/client";
import type { HeaderUser } from "./MainHeader";
import type { Viewer } from "./mobile-tabs";

export function useHeaderAccess(user: HeaderUser | undefined, organizationSlug?: string | null) {
  const { isLoaded, isSignedIn } = useAuth();
  const signedIn = !isLoaded || isSignedIn === true;
  const pathname = usePathname();

  const hasOrgMembership = signedIn && (user?.memberships?.length ?? 0) > 0;
  const isSuperAdmin = signedIn && user?.role === "ADMIN";
  // OWNER of any organization, or a platform ADMIN: these manage cars rather
  // than shop for them, so the buyer links (saved, messages) step aside.
  const isOwner =
    isSuperAdmin || (hasOrgMembership && !!user?.memberships?.some((m) => m.role === "OWNER"));

  // Signed in only once the server has said who: while Clerk loads, a guest
  // has no `user`, and must not flash a buyer's tabs first.
  const viewer: Viewer = !signedIn || !user ? "guest" : hasOrgMembership || isSuperAdmin ? "dealer" : "buyer";

  const userOrgSlug = organizationSlug || user?.memberships?.[0]?.organization?.slug;
  const isOnAdminPath = !!pathname?.startsWith("/super-admin");
  const isOnOrgPath = !!pathname?.startsWith("/org/");

  return {
    signedIn,
    /** Whom the phone navigation is for: guest, buyer or dealer (mobile-tabs.ts). */
    viewer,
    pathname,
    hasOrgMembership,
    isSuperAdmin,
    isOwner,
    isOnSubdomain: !!organizationSlug,
    isOnAdminPath,
    /** Org members and admins get a way into the dashboard, except from inside it. */
    showDashboardLink: (hasOrgMembership || isSuperAdmin) && !isOnOrgPath,
    dashboardHref: userOrgSlug ? `/org/${userOrgSlug}/dashboard` : "/super-admin",
    /** "For dealers" is for visitors without a dealership, on the marketplace. */
    showForDealers: showsDealerPitch(signedIn ? user : null, !!organizationSlug),
    /** The logo plate's band: who this viewer is, here. */
    plateBand: plateBandFor(signedIn ? user : null, organizationSlug),
    /** Members on their own subdomain see the admin nav instead of the shop nav. */
    showAdminNav: (hasOrgMembership || isSuperAdmin) && !!organizationSlug && !isOnAdminPath,
  };
}
