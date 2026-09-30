import type { Locale } from "@/i18n/routing";
import type { ListingText } from "@/lib/services/ai/translateListing";

/**
 * Keeping a listing's two languages in step when the dealer only writes one.
 *
 * The dealer form shows the fields of the dashboard's language and hides the
 * other; on save the missing or stale language is written by translation. This
 * module is the pure half of that — which way to translate, what to send, and
 * how the reply lands — so it can be tested without a model. The AI call and
 * its plan gate live in the car actions.
 */

/** The listing fields that exist per language. `title` is the English one. */
export interface BilingualListing {
  title: string;
  description?: string | null;
  descriptionEn?: string | null;
  features?: string[];
  titleAr?: string | null;
  descriptionAr?: string | null;
  featuresAr?: string[];
}

const hasText = (text?: string | null) => !!text?.trim();
const hasList = (list?: string[]) => (list ?? []).some((item) => item.trim());

function hasLanguage(car: BilingualListing, locale: Locale): boolean {
  return locale === "en"
    ? hasText(car.description) || hasList(car.features)
    : hasText(car.descriptionAr) || hasList(car.featuresAr);
}

/**
 * The language to translate from, or null when nothing needs translating.
 *
 * `editedLocale` is the language whose fields the dealer changed in this save.
 * Those win: the other language is now stale and gets rewritten from them.
 * Otherwise only a missing language is filled — an untouched AI draft already
 * carries both, and re-translating it would spend a request to change nothing.
 */
export function translationSource(
  car: BilingualListing,
  editedLocale: Locale | null
): Locale | null {
  if (editedLocale && hasLanguage(car, editedLocale)) return editedLocale;

  const en = hasLanguage(car, "en");
  const ar = hasLanguage(car, "ar");
  if (en && !ar) return "en";
  if (ar && !en) return "ar";
  return null;
}

export function sourceText(car: BilingualListing, from: Locale): ListingText {
  return from === "en"
    ? {
        title: car.title,
        description: car.description ?? "",
        features: car.features ?? [],
      }
    : {
        title: car.titleAr || car.title,
        description: car.descriptionAr ?? "",
        features: car.featuresAr ?? [],
      };
}

/**
 * Write the translation into the other language's fields.
 *
 * With `overwrite` (the dealer edited the source) every target field is
 * replaced, because all of it is now stale. Without it only empty fields are
 * filled, so anything the dealer or the photo extraction wrote survives.
 *
 * The English title is never written: the form generates it from make, model
 * and year, and a translated headline would contradict that.
 */
export function applyTranslation<T extends BilingualListing>(
  car: T,
  to: Locale,
  translated: ListingText,
  overwrite: boolean
): T {
  const text = (current: string | null | undefined, next: string) =>
    overwrite || !hasText(current) ? next : current;
  const list = (current: string[] | undefined, next: string[]) =>
    overwrite || !hasList(current) ? next : current;

  if (to === "ar") {
    return {
      ...car,
      titleAr: text(car.titleAr, translated.title),
      descriptionAr: text(car.descriptionAr, translated.description),
      featuresAr: list(car.featuresAr, translated.features),
    };
  }

  const description = text(car.description, translated.description);
  return {
    ...car,
    description,
    // The English column mirrors `description`, as the form does on submit.
    descriptionEn: description,
    features: list(car.features, translated.features),
  };
}
