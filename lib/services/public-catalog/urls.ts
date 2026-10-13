import type { Locale } from "@/i18n/routing";
import { ServiceUnavailableError } from "@/lib/utils/errors";

/**
 * Links to AutoMe's own pages, for answers read outside the site (MCP). Always
 * built from NEXT_PUBLIC_APP_URL, never from the request's host: a caller must
 * not be able to make AutoMe hand out links to a host of its choosing.
 */

/** Where an answer's links came from, so a visit can be counted against it. */
export interface LinkSource {
  /** The surface, e.g. "mcp". */
  source: string;
  /** What produced the link there, e.g. the tool's name. */
  medium: string;
}

function siteBase(): string {
  // Like the billing links: the dev server outside production, never a guess in it.
  const raw = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");
  try {
    const url = new URL(raw ?? "");
    // A trailing slash in the setting must not make "//en/cars".
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    throw new ServiceUnavailableError("NEXT_PUBLIC_APP_URL is not configured");
  }
}

function link(path: string, from?: LinkSource): string {
  const url = new URL(`${siteBase()}${path}`);
  if (from) {
    url.searchParams.set("utm_source", from.source);
    url.searchParams.set("utm_medium", from.medium);
  }
  return url.toString();
}

export function carUrl(id: string, locale: Locale, from?: LinkSource): string {
  return link(`/${locale}/cars/${encodeURIComponent(id)}`, from);
}

export function dealershipUrl(slug: string, locale: Locale, from?: LinkSource): string {
  return link(`/${locale}/dealerships/${encodeURIComponent(slug)}`, from);
}
