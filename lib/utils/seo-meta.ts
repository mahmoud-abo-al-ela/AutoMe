import type { MetadataRoute } from "next";
import { routing, type Locale } from "@/i18n/routing";
import { PROTECTED_ROUTES, SUPER_ADMIN_ROUTES } from "@/lib/route-policy";

/**
 * Metadata helpers with no JSX, deliberately separate from `seo.tsx`.
 *
 * That file exports a `StructuredData` component, which makes it a `.tsx` —
 * and importing a JSX module into `generateMetadata`, which renders nothing,
 * drags a React component into every metadata request for no reason. Keeping
 * the pure helpers here also lets the node test project load them directly.
 */

/** hreflang tags. Region-qualified: the market is Egypt, not the anglophone world. */
const HREFLANG: Record<Locale, string> = { en: "en-EG", ar: "ar-EG" };

/** Open Graph locale format is ll_CC, not the BCP-47 tag hreflang uses. */
const OG_LOCALE: Record<Locale, string> = { en: "en_EG", ar: "ar_EG" };

/** The marketplace's own origin, with no trailing slash. */
export function mainOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://autome.com").replace(
    /\/$/,
    ""
  );
}

/**
 * The locale-less path as it follows the locale segment. The home page is
 * `/en`, not `/en/` — the app does not use trailing slashes, and a canonical
 * that disagrees with the URL actually served is a redirect Google must follow.
 */
function pathSuffix(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? "" : clean;
}

/** hreflang → URL for every locale, plus `x-default`. */
function languageUrls(path: string, origin: string): Record<string, string> {
  const suffix = pathSuffix(path);
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[HREFLANG[l]] = `${origin}/${l}${suffix}`;
  }
  languages["x-default"] = `${origin}/${routing.defaultLocale}${suffix}`;
  return languages;
}

/**
 * Canonical URL and hreflang alternates for a page that exists in every locale.
 *
 * Without `alternates.languages`, Google treats `/en/cars/x` and `/ar/cars/x`
 * as duplicates and picks one to index — which, since it crawls predominantly
 * from US IPs, is unlikely to be the Arabic half of an Egypt-first marketplace.
 *
 * `x-default` points at the default locale rather than at an unprefixed URL,
 * because `localePrefix: "always"` means no unprefixed URL exists.
 *
 * Takes the locale-less path (`/cars/abc123`). `origin` defaults to the main
 * domain; a page whose content differs on a dealership subdomain passes that
 * subdomain's origin instead (see `lib/utils/page-seo.ts`).
 */
export function localeAlternates(
  path: string,
  locale: Locale,
  origin: string = mainOrigin()
) {
  return {
    canonical: `${origin}/${locale}${pathSuffix(path)}`,
    languages: languageUrls(path, origin),
  };
}

type SitemapEntry = MetadataRoute.Sitemap[number];

/**
 * One sitemap entry per locale for a page, each listing all of its siblings.
 *
 * Google reads hreflang from the sitemap as readily as from the page, and it
 * requires the set to be complete on every member — an entry that omits
 * itself, or lists siblings the others do not, is ignored. So every entry
 * carries the identical `languages` map, and only `url` differs.
 */
export function sitemapEntries(
  path: string,
  fields: Omit<SitemapEntry, "url" | "alternates"> = {},
  origin: string = mainOrigin()
): MetadataRoute.Sitemap {
  const languages = languageUrls(path, origin);
  return routing.locales.map((l) => ({
    ...fields,
    url: `${origin}/${l}${pathSuffix(path)}`,
    alternates: { languages },
  }));
}

/**
 * Pages a crawler has no business fetching, beyond the signed-in ones: the
 * auth screens, the post-sign-in bounce, the dealer sign-up wizard, and the
 * compare page, whose every URL is a different query-string permutation of
 * cars that already have their own pages.
 */
const UNINDEXED_PUBLIC_PATHS = [
  "/sign-in",
  "/sign-up",
  "/auth-redirect",
  "/onboarding",
  "/compare",
];

/**
 * The robots.txt `Disallow` list, derived from the route policy rather than
 * restated, so a newly protected surface is kept out of the index by the same
 * edit that puts it behind sign-in. Robots paths are prefixes, so `/en/org`
 * covers everything under it; the route-policy `(.*)` suffix is dropped.
 */
export function crawlDisallowPaths(): string[] {
  const bases = [
    ...PROTECTED_ROUTES,
    ...SUPER_ADMIN_ROUTES,
    ...UNINDEXED_PUBLIC_PATHS,
  ].map((pattern) => pattern.replace(/\(\.\*\)$/, ""));

  return [
    "/api/",
    ...routing.locales.flatMap((l) => bases.map((base) => `/${l}${base}`)),
  ];
}

export function openGraphLocale(locale: Locale): string {
  return OG_LOCALE[locale];
}

export function openGraphAlternateLocales(locale: Locale): string[] {
  return routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]);
}

/** Meta descriptions are truncated around 155-160 characters in results. */
export const META_DESCRIPTION_LIMIT = 155;

/**
 * Trim text to fit a meta description: collapse whitespace, cut on a word
 * boundary rather than mid-word, and only add an ellipsis when something was
 * actually removed. The 0.6 guard keeps a single very long word from collapsing
 * the result to almost nothing.
 */
export function truncateForMeta(
  text: string,
  limit = META_DESCRIPTION_LIMIT
): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= limit) return collapsed;

  const cut = collapsed.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  const kept = lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${kept.trimEnd()}…`;
}
