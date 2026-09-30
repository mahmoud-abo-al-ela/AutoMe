/**
 * The one way a place name is folded before it is looked up.
 *
 * Both the display index and the search index key on this, so a spelling that
 * resolves for display resolves for search too. Keeping two normalizers is how
 * the previous version came to have an Arabic-aware one on the search side and
 * an ASCII-only one on the display side — the latter reduced every Arabic name
 * to the empty string, silently dropping half of each index.
 *
 * The Arabic half of the fold is not written here for the same reason: it is
 * `foldSearchText`, shared with the car search index, which is mirrored in SQL.
 * A place name and a car description have to fold the same way or a dealership
 * in "القاهره" stops being findable from a car listing that says "القاهرة".
 *
 * What remains here is what is specific to a *place*: Latin transliteration
 * marks, the administrative suffixes, and the article.
 */

import { foldSearchText } from "@/lib/utils/search-text";

const LATIN_MARKS = /[̀-ͯ]/g;
/** Anything that is neither a latin alphanumeric nor an Arabic letter. */
const SEPARATORS = /[^a-z0-9؀-ۿ]+/g;

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
