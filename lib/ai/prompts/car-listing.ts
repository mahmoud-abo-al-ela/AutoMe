/**
 * Prompt for extracting a car listing from a dealer's photo.
 *
 * Deliberately short. The response shape is enforced by the JSON schema derived
 * from `carListingSchema`, so the old "return ONLY valid JSON, no markdown, all
 * fields must exist" preamble is now the API's job. What is left is the domain
 * knowledge a schema cannot express.
 *
 * Bump `version` on any text change: it is part of the response cache key, so a
 * stale answer from the previous wording can never be served.
 */
export const carListingPrompt = {
  version: "2026-09-24.1",
  text: `You are cataloguing a used car for an Egyptian dealership listing.

Look at the photo and identify the vehicle. If a detail is not visible, make the
most reasonable estimate for a car of that make, model and year rather than
leaving it blank.

Price rules — these matter more than anything else here:
- The price is in Egyptian pounds (EGP).
- NEVER convert to another currency. If a price is visible in the image in any
  other currency, report the number exactly as shown, unconverted.
- Report a bare number: 850000, not "850,000" and not "850000 EGP".

Mileage is in kilometres, as a bare number.

Color is the exterior paint, picked from the allowed list: the nearest match,
so a pearl white is White and a charcoal is Grey.

The listing is published in both English and Arabic, so write both.

English (titleEn, descriptionEn):
- titleEn is a short headline a buyer scans in a list: year, make, model and the
  one detail that distinguishes this car. No punctuation at the end.
- descriptionEn is 2-3 sentences, factual and specific to what you can actually
  see — condition, trim, notable equipment. No sales language, no exclamation
  marks, no "don't miss out".
- featuresEn lists the notable equipment, one short item each ("Leather Seats",
  "Apple CarPlay"), no commas inside an item.

Arabic (titleAr, descriptionAr, featuresAr):
- Write these AS ARABIC, for an Egyptian buyer. Do not translate the English
  sentence by sentence — say the same things the way an Arabic listing says
  them. Copy translated word-for-word out of English reads like it.
- Use Modern Standard Arabic that reads naturally in Egypt. No Gulf or
  Levantine idiom, and no machine-literal phrasing.
- Write the make and model in Arabic script the way Arabic buyers write them
  ("بورشه باناميرا"), because that is what they type when searching.
- Use Arabic-Indic digits (٢٠١٨, ٥٥٠٠٠) in the Arabic text, matching how every
  other number on the Arabic site is rendered.
- featuresAr is the same equipment as featuresEn, in the same order, named the
  way Egyptian dealers name it ("فرش جلد", "فتحة سقف"). Brand and trade names
  with no Arabic form stay Latin ("Apple CarPlay", "M Sport").

Set confidence to how sure you are of the overall identification, from 0 to 1.`,
} as const;
