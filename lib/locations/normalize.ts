import { ARABIC_LETTERS, foldSearchText } from "@/lib/utils/search-text";

const LATIN_MARKS = /[̀-ͯ]/g;
const SEPARATORS = new RegExp(`[^a-z0-9${ARABIC_LETTERS}]+`, "g");

export function normalizePlaceName(value: string): string {
  return (
    foldSearchText(value)
      // "Al Maḩallah al Kubrá" reaches "El Mahalla El Kubra". Arabic is
      // untouched by this: foldSearchText has already replaced every form
      // that decomposes.
      .normalize("NFD")
      .replace(LATIN_MARKS, "")
      // Punctuation, apostrophe variants and hyphens all read as separators, so
      // a slug folds to the same key as the name it was derived from.
      .replace(SEPARATORS, " ")
      // "Alexandria Governorate" and "Alexandria" are the same place; the old
      // location API wrote the suffix and egydata does not.
      .replace(/\bgovernorates?\b/g, " ")
      .replace(/\b(al|el)\b/g, " ")
      // A final ta marbuta is transliterated both ways — "Mahalla" and
      // "Mahallah" are one town.
      .replace(/([aeiou])h\b/g, "$1")
      .replace(/\s+/g, " ")
      .trim()
  );
}
