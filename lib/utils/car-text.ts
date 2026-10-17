import type { Locale } from "@/i18n/routing";

/** Only the text columns; deliberately loose so serialized and raw rows both fit. */
export interface BilingualCarText {
  title?: string | null;
  titleEn?: string | null;
  titleAr?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
}

export interface ResolvedCarText {
  text: string;
  locale: Locale;
  /** The reader asked for one language and is being shown the other. */
  fellBack: boolean;
}

/** A candidate column and the language it holds. */
type Candidate = [text: string | null | undefined, locale: Locale];

/** Empty strings are as useless as nulls here, and the model can emit "". */
function firstNonEmpty(candidates: Candidate[]): [string, Locale] | null {
  for (const [text, locale] of candidates) {
    const trimmed = text?.trim();
    if (trimmed) return [trimmed, locale];
  }
  return null;
}

function resolve(
  wanted: Locale,
  preferred: Candidate[],
  fallback: Candidate[]
): ResolvedCarText | null {
  const hit = firstNonEmpty(preferred);
  if (hit) return { text: hit[0], locale: hit[1], fellBack: false };

  const other = firstNonEmpty(fallback);
  if (other) return { text: other[0], locale: other[1], fellBack: true };

  return null;
}

export function resolveCarTitle(
  car: BilingualCarText,
  locale: Locale
): ResolvedCarText | null {
  return locale === "ar"
    ? resolve(locale, [[car.titleAr, "ar"]], [[car.titleEn, "en"], [car.title, "en"]])
    : resolve(locale, [[car.titleEn, "en"], [car.title, "en"]], [[car.titleAr, "ar"]]);
}

/** Only the feature columns; loose for the same reason as BilingualCarText. */
export interface BilingualCarFeatures {
  features?: string[] | null;
  featuresAr?: string[] | null;
}

export interface ResolvedCarFeatures {
  features: string[];
  /** The language the list is actually in, for `dir`. */
  locale: Locale;
  fellBack: boolean;
}

export function resolveCarFeatures(
  car: BilingualCarFeatures,
  locale: Locale
): ResolvedCarFeatures {
  const lists: Record<Locale, string[]> = {
    en: (car.features ?? []).filter((f) => f.trim()),
    ar: (car.featuresAr ?? []).filter((f) => f.trim()),
  };
  const other: Locale = locale === "ar" ? "en" : "ar";

  if (lists[locale].length > 0 || lists[other].length === 0) {
    return { features: lists[locale], locale, fellBack: false };
  }
  return { features: lists[other], locale: other, fellBack: true };
}

export function resolveCarDescription(
  car: BilingualCarText,
  locale: Locale
): ResolvedCarText | null {
  return locale === "ar"
    ? resolve(
        locale,
        [[car.descriptionAr, "ar"]],
        [[car.descriptionEn, "en"], [car.description, "en"]]
      )
    : resolve(
        locale,
        [[car.descriptionEn, "en"], [car.description, "en"]],
        [[car.descriptionAr, "ar"]]
      );
}
