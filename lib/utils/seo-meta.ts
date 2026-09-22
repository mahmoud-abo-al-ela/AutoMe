import { routing, type Locale } from "@/i18n/routing";

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
 * Takes the locale-less path (`/cars/abc123`). Nothing else on the site emits
 * these yet, so this is a shared helper rather than inline metadata — roadmap
 * 3.5 wants the same tags on the listing, dealership and static pages.
 */
export function localeAlternates(path: string, locale: Locale) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://autome.com").replace(
    /\/$/,
    ""
  );
  const clean = path.startsWith("/") ? path : `/${path}`;

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[HREFLANG[l]] = `${base}/${l}${clean}`;
  }
  languages["x-default"] = `${base}/${routing.defaultLocale}${clean}`;

  return { canonical: `${base}/${locale}${clean}`, languages };
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
