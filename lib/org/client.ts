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
