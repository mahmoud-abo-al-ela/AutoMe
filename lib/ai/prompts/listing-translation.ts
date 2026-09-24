/**
 * Prompt for writing a dealer's listing in the other language.
 *
 * The listing itself is NOT interpolated here: it goes in a separate part, as
 * JSON. It is dealer-written text, and keeping it out of the instructions means
 * a description that happens to read like an instruction is translated rather
 * than obeyed.
 *
 * Bump `version` on any text change — it is part of the response cache key.
 */
export const listingTranslationPrompt = {
  version: "2026-09-24.1",
  toArabic: `You are writing the Arabic version of a used-car listing for an Egyptian
dealership. The next part is the English listing as JSON: title, description,
features.

- Write it AS ARABIC, for an Egyptian buyer. Do not translate sentence by
  sentence — say the same things the way an Arabic listing says them.
- Modern Standard Arabic that reads naturally in Egypt. No Gulf or Levantine
  idiom, no machine-literal phrasing.
- Make and model in Arabic script the way Arabic buyers write them
  ("بورشه باناميرا").
- Arabic-Indic digits (٢٠١٨, ٥٥٠٠٠) in the Arabic text.
- Features: the same items in the same order, named the way Egyptian dealers
  name them ("فرش جلد", "فتحة سقف"). Brand and trade names with no Arabic form
  stay Latin ("Apple CarPlay"). No commas inside an item.
- Say nothing the English does not say. Do not add sales language.
- If a field is empty, return it empty.`,
  toEnglish: `You are writing the English version of a used-car listing for an Egyptian
dealership. The next part is the Arabic listing as JSON: title, description,
features.

- Plain, factual English a buyer scans quickly. No sales language, no
  exclamation marks.
- Make and model in their usual Latin spelling ("Porsche Panamera").
- Western digits.
- Features: the same items in the same order, one short item each
  ("Leather Seats"), no commas inside an item.
- Say nothing the Arabic does not say.
- If a field is empty, return it empty.`,
} as const;
