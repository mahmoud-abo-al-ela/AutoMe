import { routing, isLocale, type Locale } from "@/i18n/routing";

/**
 * Which language to *suggest* — never to redirect to.
 *
 * `routing.localeDetection` is off on purpose (see i18n/routing.ts): the URL
 * decides the language, always. What the browser's Accept-Language does buy
 * is a dismissible offer, so that someone whose browser asks for Arabic and
 * who lands on an English link is one tap from the Arabic page.
 */

/**
 * The cookie that records an explicit choice: accepting or dismissing the
 * suggestion, or using the language switcher. Any value suppresses the banner
 * for good. It is deliberately not next-intl's NEXT_LOCALE, which is written
 * the moment someone opens a shared link in a language other than their
 * browser's — a fact about the link, not a choice by the reader.
 */
export const LOCALE_CHOICE_COOKIE = "autome-locale-choice";

/** One year. A language preference does not go stale. */
export const LOCALE_CHOICE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * The best supported locale in an Accept-Language header, or null.
 *
 * Ranked by q-value, ties broken by order of appearance, and matched on the
 * primary subtag only — `ar-EG`, `ar-SA` and bare `ar` all mean Arabic here.
 * `*` and `q=0` (an explicit "not this") are skipped rather than matched.
 */
export function preferredLocale(
  header: string | null | undefined,
  locales: readonly Locale[] = routing.locales
): Locale | null {
  if (!header) return null;

  const ranked = header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.split(";").map((s) => s.trim());
      const q = params.find((p) => p.startsWith("q="));
      const quality = q === undefined ? 1 : Number(q.slice(2));
      return {
        primary: tag.toLowerCase().split("-")[0],
        quality: Number.isFinite(quality) ? quality : 0,
        index,
      };
    })
    .filter((entry) => entry.primary && entry.primary !== "*" && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const { primary } of ranked) {
    const match = locales.find((locale) => locale === primary);
    if (match) return match;
  }
  return null;
}

/**
 * The locale to offer the reader of a `current`-locale page, or null to
 * show nothing: when they have already chosen, when the browser states no
 * supported preference, or when it already matches the page.
 */
export function localeToSuggest(
  current: Locale,
  acceptLanguage: string | null | undefined,
  choice: string | null | undefined
): Locale | null {
  if (choice && isLocale(choice)) return null;

  const preferred = preferredLocale(acceptLanguage);
  return preferred && preferred !== current ? preferred : null;
}

/** Records an explicit language choice. Client-side only. */
export function rememberLocaleChoice(locale: Locale): void {
  document.cookie = `${LOCALE_CHOICE_COOKIE}=${locale}; path=/; max-age=${LOCALE_CHOICE_MAX_AGE}; samesite=lax`;
}
