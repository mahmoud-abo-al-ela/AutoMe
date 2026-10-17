import {
  BODY_TYPES,
  FUEL_TYPES,
  TRANSMISSIONS,
} from "@/lib/constants/car-options";

/** Arabic block, plus the presentation forms some models emit. */
const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

/** Latin letters. Marque names inside Arabic text are fine; sentences are not. */
const LATIN = /[A-Za-z]/;

/** Arabic-Indic and extended Arabic-Indic digits. */
const ARABIC_DIGITS = /[٠-٩۰-۹]/;

const WESTERN_DIGITS = /[0-9]/;

export function containsArabic(text: string): boolean {
  return ARABIC.test(text);
}

export function isPredominantlyArabic(text: string): boolean {
  const arabic = (text.match(new RegExp(ARABIC, "g")) ?? []).length;
  const latin = (text.match(new RegExp(LATIN, "g")) ?? []).length;

  if (arabic === 0) return false;
  // Latin is expected — "Porsche Panamera" inside an Arabic sentence is
  // correct — so this only has to catch an English sentence wearing one
  // Arabic word.
  return arabic > latin;
}

export function containsArabicDigits(text: string): boolean {
  return ARABIC_DIGITS.test(text);
}

export function containsWesternDigits(text: string): boolean {
  return WESTERN_DIGITS.test(text);
}

const ALLOWLISTS: Record<string, string[]> = {
  bodyType: BODY_TYPES,
  fuelType: FUEL_TYPES,
  transmission: TRANSMISSIONS,
};

/** The enum fields are constrained by the response schema; this proves it held. */
export function isAllowlisted(field: keyof typeof ALLOWLISTS, value: string): boolean {
  return ALLOWLISTS[field].includes(value);
}

export function isPlausibleEgpCarPrice(price: number): boolean {
  return price >= 50_000 && price <= 100_000_000;
}

/** Mileage in kilometres, not miles, and not a price by mistake. */
export function isPlausibleKilometres(mileage: number): boolean {
  return mileage >= 0 && mileage <= 1_000_000;
}

/** Every piece of listing text a buyer can read, in both languages. */
export function listingText(draft: {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  featuresEn: string[];
  featuresAr: string[];
}): string {
  return [
    draft.titleEn,
    draft.titleAr,
    draft.descriptionEn,
    draft.descriptionAr,
    ...draft.featuresEn,
    ...draft.featuresAr,
  ].join("\n");
}

/**
 * The first of `needles` that appears in `text`, whitespace-insensitive (a
 * plate "س ط ع" is as much a leak written "سطع"), or null.
 */
export function firstLeak(text: string, needles: string[]): string | null {
  const squash = (s: string) => s.replace(/\s+/g, "");
  const haystack = squash(text);
  return needles.find((needle) => haystack.includes(squash(needle))) ?? null;
}

const EGYPTIAN_DIALECT = [
  "مفيش", "دلوقتي", "دلوقت", "أيوه", "ايوه", "لأ", "مش", "عايز", "عايزة", "عاوز", "إزاي", "ازاي",
  "كده", "فين", "إمتى", "امتى", "اللي", "ده", "دي", "دول", "بتاع", "بتاعة", "بتاعت", "العربية دي",
  "عربيتك", "عربيتي", "يقولك", "هيوصل", "هتلاقي",
];

const ARABIC_LETTER = "؀-ۿ";
// Longest first, so a phrase is named before the word inside it.
const DIALECT_PATTERNS = [...EGYPTIAN_DIALECT].sort((a, b) => b.length - a.length).map(
  // Whole words, allowing the conjunctions و/ف in front: "ومفيش" is still مفيش.
  (word) => [word, new RegExp(`(?<![${ARABIC_LETTER}])[وف]?${word}(?![${ARABIC_LETTER}])`)] as const
);

/** The first Egyptian colloquial word in the text, or null when it reads as MSA. */
export function egyptianDialectWord(text: string): string | null {
  return DIALECT_PATTERNS.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}
