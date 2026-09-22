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
  version: "2026-09-22.1",
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

Write the description in English, 2-3 sentences, factual and specific to what you
can actually see — condition, trim, notable equipment. No sales language.

Set confidence to how sure you are of the overall identification, from 0 to 1.`,
} as const;
