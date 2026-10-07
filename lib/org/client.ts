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
