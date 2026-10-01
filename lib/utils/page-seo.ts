import { headers } from "next/headers";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/routing";
import { getCurrentOrganization } from "@/lib/getOrganization";
import {
  localeAlternates,
  mainOrigin,
  openGraphAlternateLocales,
  openGraphLocale,
} from "@/lib/utils/seo-meta";

/**
 * The dealership subdomain's origin when the request is on one, else null.
 *
 * `x-subdomain` is set by the middleware from the Host header, and only for a
 * host under NEXT_PUBLIC_ROOT_DOMAIN (the middleware strips a client-sent
 * copy first), so the host it came from is safe to echo back. Impersonation
 * sets the organization header on the main domain but not this one, which is
 * the point: a super-admin viewing a dealership is still on the main domain.
 */
async function subdomainOrigin(): Promise<string | null> {
  const h = await headers();
  const host = h.get("host");
  if (!h.get("x-subdomain") || !host) return null;

  const forwarded = h.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto =
    forwarded || (host.split(":")[0].endsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** The origin this request is being served on. */
export async function requestOrigin(): Promise<string> {
  return (await subdomainOrigin()) ?? mainOrigin();
}

/**
 * Title, description, canonical, hreflang and Open Graph for a page that
 * exists in every locale.
 *
 * A dealership subdomain serves every route the main domain does, but only
 * two of them with different content: the home page is the dealership's
 * storefront, and the car list is its stock. Those pass `tenantScoped` and
 * canonicalise onto the subdomain — pointing them at the main domain would
 * declare the storefront a duplicate of the marketplace home. Everything else
 * (about, legal, a dealership's own page) is the same document on any host,
 * and canonicalises onto the main domain so the copies do not compete.
 *
 * Open Graph does not inherit the page title — without its own `title` and
 * `description` a shared link previews as a bare URL — and it is replaced, not
 * merged, by any segment that sets it. So the page's copy is passed in and
 * repeated here, and a page with more to say (images, type) spreads
 * `openGraph` into its own. On a subdomain storefront the site's name is the
 * dealership's, as it is in the tab title.
 *
 * Omit `title` to keep the root layout's `title.default` (the home page).
 */
export async function localizedPageMetadata(
  path: string,
  locale: Locale,
  copy: { title?: string; description?: string; tenantScoped?: boolean } = {}
) {
  const subdomain = copy.tenantScoped ? await subdomainOrigin() : null;
  const organization = subdomain ? await getCurrentOrganization() : null;
  const alternates = localeAlternates(
    path,
    locale,
    subdomain ?? mainOrigin()
  );

  return {
    ...(copy.title && { title: copy.title }),
    ...(copy.description && { description: copy.description }),
    alternates,
    openGraph: {
      ...(copy.title && { title: copy.title }),
      ...(copy.description && { description: copy.description }),
      type: "website",
      url: alternates.canonical,
      siteName: organization?.name ?? "AutoMe",
      locale: openGraphLocale(locale),
      alternateLocale: openGraphAlternateLocales(locale),
    },
  } satisfies Metadata;
}
