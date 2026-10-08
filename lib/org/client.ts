import { routing } from "@/i18n/routing";

/**
 * The org slug from a path, with or without the locale prefix — "/ar/org/x/…"
 * and "/org/x/…" both give "x". Every dashboard path is locale-prefixed now,
 * so reading "org" as segment 0 would miss them all.
 */
export function getOrgSlugFromPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const start = (routing.locales as readonly string[]).includes(segments[0]) ? 1 : 0;
  if (segments[start] === "org" && segments[start + 1]) {
    return segments[start + 1];
  }
  return null;
}

/**
 * Whether the dealer pitch — the "For dealers" links and the home page's
 * dealer band — is for this visitor. Not on a dealership's own storefront,
 * and not for anyone already in a dealership (their plan and billing are in
 * the dashboard) or running the platform.
 */
export function showsDealerPitch(
  user: { role?: string | null; memberships?: readonly unknown[] | null } | null | undefined,
  onSubdomain: boolean
): boolean {
  if (onSubdomain) return false;
  if (!user) return true;
  return user.role !== "ADMIN" && (user.memberships?.length ?? 0) === 0;
}

export type PlateBand = "buyer" | "owner" | "team" | "admin";

const PLATE_BANDS: readonly PlateBand[] = ["buyer", "owner", "team", "admin"];

/** Where the header leaves the band for the root loading screen. */
export const PLATE_BAND_COOKIE = "autome-plate-band";

/** A band from untrusted input (the cookie); anything unknown is the plain plate. */
export function parsePlateBand(value: string | null | undefined): PlateBand {
  return PLATE_BANDS.includes(value as PlateBand) ? (value as PlateBand) : "buyer";
}

/**
 * The band inside a dealership's dashboard, from the viewer's membership role
 * there. No role means a platform admin or an impersonator.
 */
export function plateBandForMemberRole(role: string | null | undefined): PlateBand {
  if (role === "OWNER") return "owner";
  if (role === "MEMBER") return "team";
  return "admin";
}

/**
 * Which band the logo plate carries for this viewer (components/brand/Logo).
 *
 * Platform staff — and a super admin impersonating a dealer, who is still
 * staff — get ADMIN everywhere. A dealership's people get OWNER or TEAM; on a
 * dealership's storefront that is their role in *that* dealership, and on
 * another dealership's storefront they are a buyer like anyone else (the
 * same line the buyer policy draws). On the marketplace the highest role
 * they hold anywhere stands. Everyone else, signed out included: EGYPT.
 */
export function plateBandFor(
  user:
    | {
        role?: string | null;
        isImpersonated?: boolean | null;
        memberships?: readonly { role?: string | null; organization?: { slug?: string | null } | null }[] | null;
      }
    | null
    | undefined,
  storefrontSlug?: string | null
): PlateBand {
  if (!user) return "buyer";
  if (user.isImpersonated || user.role === "ADMIN") return "admin";
  const memberships = storefrontSlug
    ? (user.memberships ?? []).filter((m) => m.organization?.slug === storefrontSlug)
    : (user.memberships ?? []);
  if (memberships.some((m) => m.role === "OWNER")) return "owner";
  if (memberships.length > 0) return "team";
  return "buyer";
}

/**
 * Whether a path is the super-admin, with or without the locale prefix. The
 * one dashboard still on the original theme: the dealer dashboard moved to
 * the site's (work mode), so it takes the site's loader rather than the old
 * splash.
 */
export function isSuperAdminPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const start = (routing.locales as readonly string[]).includes(segments[0]) ? 1 : 0;
  return segments[start] === "super-admin";
}
