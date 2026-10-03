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
 * Whether a path is a dashboard — a dealership's /org/… or the super-admin —
 * rather than the public site, with or without the locale prefix. Public
 * routes and dashboards share the locale layout and its loading boundary, and
 * these decide which loader each gets.
 */
export function isDashboardPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  const start = (routing.locales as readonly string[]).includes(segments[0]) ? 1 : 0;
  return segments[start] === "org" || segments[start] === "super-admin";
}
