import type { MetadataRoute } from "next";
import { routing, type Locale } from "@/i18n/routing";
import { PROTECTED_ROUTES, SUPER_ADMIN_ROUTES } from "@/lib/route-policy";

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

function pathSuffix(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return clean === "/" ? "" : clean;
}

/** A page's absolute URL in one locale: `https://…/ar/cars/x`. */
export function localizedUrl(path: string, locale: Locale, origin: string = mainOrigin()): string {
  return `${origin}/${locale}${pathSuffix(path)}`;
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

const UNINDEXED_PUBLIC_PATHS = [
  "/sign-in",
  "/sign-up",
  "/auth-redirect",
  "/onboarding",
  "/compare",
];

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

export const TITLE_LIMIT = 60;
const TITLE_SUFFIX = " | AutoMe";

export function fitsTitle(title: string): boolean {
  return title.length + TITLE_SUFFIX.length <= TITLE_LIMIT;
}

/** Meta descriptions are truncated around 155-160 characters in results. */
export const META_DESCRIPTION_LIMIT = 155;

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
