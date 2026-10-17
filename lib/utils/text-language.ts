import type { Locale } from "@/i18n/routing";

/** Arabic letters, including the presentation forms some keyboards emit. */
const ARABIC_LETTER = /[ء-يٱ-ۓۺ-ۿﭐ-﷿ﹰ-ﻼ]/g;
const LATIN_LETTER = /[A-Za-z]/g;

export function detectTextLanguage(text: string): Locale | null {
  const arabic = text.match(ARABIC_LETTER)?.length ?? 0;
  const latin = text.match(LATIN_LETTER)?.length ?? 0;
  if (arabic === 0 && latin === 0) return null;
  return arabic > latin ? "ar" : "en";
}
