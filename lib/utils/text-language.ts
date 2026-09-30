import type { Locale } from "@/i18n/routing";

/** Arabic letters, including the presentation forms some keyboards emit. */
const ARABIC_LETTER = /[ء-يٱ-ۓۺ-ۿﭐ-﷿ﹰ-ﻼ]/g;
const LATIN_LETTER = /[A-Za-z]/g;

/**
 * Which of the site's two languages a chat message is written in, by counting
 * letters: more Arabic than Latin is Arabic. Deterministic and free — it only
 * decides whether to offer "Translate", never what the translation says.
 *
 * "Verna 2015 بكام؟" is Arabic (a model name inside an Arabic sentence);
 * "ok 👍" is English; "٥٥٠٠٠" or "👍" has no letters and is neither, since
 * there is nothing to translate.
 */
export function detectTextLanguage(text: string): Locale | null {
  const arabic = text.match(ARABIC_LETTER)?.length ?? 0;
  const latin = text.match(LATIN_LETTER)?.length ?? 0;
  if (arabic === 0 && latin === 0) return null;
  return arabic > latin ? "ar" : "en";
}
