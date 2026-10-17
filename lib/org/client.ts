import { routing } from "@/i18n/routing";

export function getOrgSlugFromPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const start = (routing.locales as readonly string[]).includes(segments[0]) ? 1 : 0;
  if (segments[start] === "org" && segments[start + 1]) {
    return segments[start + 1];
  }
  return null;
}

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

export function isSuperAdminPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const start = (routing.locales as readonly string[]).includes(segments[0]) ? 1 : 0;
  return segments[start] === "super-admin";
}
