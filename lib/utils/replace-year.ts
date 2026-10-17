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
