import type { Locale } from "@/i18n/routing";
import { detectTextLanguage } from "./text-language";

export const DEALERSHIP_TEXT_FIELDS = ["description", "address", "financingNote"] as const;
export type DealershipTextField = (typeof DEALERSHIP_TEXT_FIELDS)[number];

export type BilingualDealershipText = Partial<
  Record<DealershipTextField | `${DealershipTextField}${"En" | "Ar"}`, string | null>
>;

export interface ResolvedText {
  text: string;
  /** The language the text is actually in, for `lang` and `dir`. */
  locale: Locale;
  /** The reader asked for one language and is being shown the other. */
  fellBack: boolean;
}

export interface TranslationItem {
  field: DealershipTextField;
  source: string;
  from: Locale;
  to: Locale;
}

const other = (locale: Locale): Locale => (locale === "en" ? "ar" : "en");

/** The `…En` / `…Ar` column for a field. */
export const languageColumn = (field: DealershipTextField, locale: Locale) =>
  `${field}${locale === "en" ? "En" : "Ar"}` as const;

const read = (org: BilingualDealershipText, key: keyof BilingualDealershipText) => org[key]?.trim() || null;

/** The dealer's text for a field and its language, or null when there is none. */
function sourceOf(org: BilingualDealershipText, field: DealershipTextField) {
  const text = read(org, field);
  if (!text) return null;
  // Text with no letters at all (a phone number) reads the same either way.
  return { text, locale: detectTextLanguage(text) ?? ("en" as Locale) };
}

/** The translation of a field into the other language, if made from the current text. */
function currentTranslation(org: BilingualDealershipText, field: DealershipTextField, text: string, from: Locale) {
  return read(org, languageColumn(field, from)) === text ? read(org, languageColumn(field, other(from))) : null;
}

export function resolveDealershipText(
  org: BilingualDealershipText,
  field: DealershipTextField,
  locale: Locale
): ResolvedText | null {
  const source = sourceOf(org, field);
  if (!source) return null;
  if (source.locale === locale) return { text: source.text, locale, fellBack: false };

  const translated = currentTranslation(org, field, source.text, source.locale);
  return translated
    ? { text: translated, locale, fellBack: false }
    : { text: source.text, locale: source.locale, fellBack: true };
}

/**
 * The fields to translate — empty when every field is in step with the
 * dealer's text. Language-neutral text (no letters) is never sent.
 */
export function dealershipTranslationPlan(org: BilingualDealershipText): TranslationItem[] {
  return DEALERSHIP_TEXT_FIELDS.flatMap((field) => {
    const text = read(org, field);
    const from = text ? detectTextLanguage(text) : null;
    if (!text || !from || currentTranslation(org, field, text, from)) return [];
    return [{ field, source: text, from, to: other(from) }];
  });
}

/** `lang` and `dir` for showing resolved text inside a page of either direction. */
export const textDirection = (resolved: ResolvedText) => ({
  lang: resolved.locale,
  dir: resolved.locale === "ar" ? ("rtl" as const) : ("ltr" as const),
});
