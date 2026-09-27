/**
 * The `Car.imageAlts` Json column: alt text per image URL, both languages.
 *
 * Pure and dependency-free so both the serializer (which renders it) and the
 * service that writes it can read it — the serializer must not pull in the AI
 * client or the database to do so.
 */

export interface ImageAlt {
  en: string;
  ar: string;
}

export type ImageAlts = Record<string, ImageAlt>;

/** Read the column defensively: anything malformed counts as no alt text. */
export function parseImageAlts(value: unknown): ImageAlts {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const alts: ImageAlts = {};
  for (const [url, alt] of Object.entries(value as Record<string, unknown>)) {
    const a = alt as Partial<ImageAlt> | null;
    if (a && typeof a.en === "string" && typeof a.ar === "string") {
      alts[url] = { en: a.en, ar: a.ar };
    }
  }
  return alts;
}
