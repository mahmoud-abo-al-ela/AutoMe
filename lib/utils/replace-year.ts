/**
 * Replace a model year in listing text, in Western or Arabic-Indic digits.
 *
 * The AI writes the year into the title and description of both languages —
 * "Kia Cerato 2020", "كيا سيراتو ٢٠٢٠" — so when the dealer corrects the Year
 * field, the text has to follow or the listing contradicts itself. Only the
 * whole number is replaced: 2020 inside 12020 or 20201 is left alone. Each
 * occurrence keeps the digits it was written in.
 */

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";

function toArabicIndic(value: string): string {
  return value.replace(/\d/g, (d) => ARABIC_INDIC[Number(d)]);
}

/** A four-digit model year worth rewriting text for, or null. */
export function asModelYear(value: unknown): number | null {
  const year = Number(value);
  return Number.isInteger(year) && year >= 1900 && year <= 2100 ? year : null;
}

export function replaceYear(text: string, from: number, to: number): string {
  if (!text || from === to) return text;
  const western = String(from);
  const arabic = toArabicIndic(western);
  // Not next to another digit of either script.
  const pattern = new RegExp(`(?<![0-9٠-٩])(${western}|${arabic})(?![0-9٠-٩])`, "g");
  return text.replace(pattern, (match) =>
    match === western ? String(to) : toArabicIndic(String(to))
  );
}
