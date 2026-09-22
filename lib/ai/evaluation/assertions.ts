import {
  BODY_TYPES,
  FUEL_TYPES,
  TRANSMISSIONS,
} from "@/lib/constants/car-options";

/**
 * Checks an evaluation suite makes about real model output.
 *
 * Separate from the suite, and unit-tested themselves, because an evaluation is
 * only as trustworthy as its assertions: a script check that quietly passes on
 * English would report a bilingual feature as working while it silently
 * regressed to one language.
 *
 * Everything here is deterministic. Judging prose quality is a different
 * problem and is not attempted — these answer "is this the right shape and the
 * right language", which is what a regression actually looks like.
 */

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

/**
 * Whether text is *substantially* Arabic rather than merely containing a word
 * of it.
 *
 * A model that ignores the instruction tends to answer in English with an
 * Arabic marque transliterated, which `containsArabic` alone would pass. The
 * ratio is over letters only, so digits and punctuation do not skew a short
 * string.
 */
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

/**
 * Whether a price reads as Egyptian pounds rather than a converted figure.
 *
 * The failure this exists for: a model that helpfully converts to USD divides
 * every listing price by roughly fifty. A used car in Egypt below ~50,000 EGP
 * is implausible, and a figure in the tens of thousands is exactly what a USD
 * conversion of a normal EGP price looks like — so the floor catches the bug
 * without needing to know the right answer.
 */
export function isPlausibleEgpCarPrice(price: number): boolean {
  return price >= 50_000 && price <= 100_000_000;
}

/** Mileage in kilometres, not miles, and not a price by mistake. */
export function isPlausibleKilometres(mileage: number): boolean {
  return mileage >= 0 && mileage <= 1_000_000;
}
