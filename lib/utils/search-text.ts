/**
 * The one fold applied to searchable text — on BOTH sides of the index.
 *
 * Arabic writes the same word several ways. A reader types "القاهره" for
 * "القاهرة", "احمد" for "أحمد", and copies "٢٠٢٠" out of a page that renders
 * Eastern numerals. None of those match their stored form as typed, and a
 * search index that does not fold them simply misses.
 *
 * ⚠️ **This function is mirrored in SQL.** `fold_search_text()` in
 * `prisma/migrations/20260922120000_normalize_arabic_search` must fold
 * identically, because the stored `Car.searchVector` is built through it and
 * the query is built through this one. Folding one side and not the other is
 * worse than folding neither: results stop being merely incomplete and start
 * being unpredictable. `test/search.test.ts` runs the same fixtures through
 * both and asserts they agree — it needs a real Postgres.
 *
 * That mirroring is why the Arabic folding here is a plain character table
 * rather than the `NFD` + strip-combining-marks trick used elsewhere: SQL has
 * no Unicode decomposition, and a rule that cannot be written on both sides
 * cannot be used on either.
 *
 * Every character class below is built from explicit code points. Written as
 * literals they are unreadable, and worse, easy to get wrong in a way that
 * still looks right: `[ً-ٰ]` reads as "the Arabic marks" and is actually a
 * range that swallows the Arabic-Indic digits sitting between them.
 */

const char = (code: number) => String.fromCodePoint(code);
const range = (from: number, to: number) => `${char(from)}-${char(to)}`;
const classOf = (...parts: string[]) => new RegExp(`[${parts.join("")}]`, "g");

/**
 * Letters a reader writes interchangeably, folded to one form.
 *
 * This is the standard Arabic normalization — the same set Lucene and
 * Elasticsearch apply — and the restraint is the point. Every one of these is
 * a spelling of the same word: Egyptian keyboards put أ and ا on the same
 * keystroke for most people, and "القاهره" is how "القاهرة" gets typed.
 *
 * The other hamza carriers, ؤ and ئ, are deliberately NOT folded. Mapping them
 * to their bare letters would not make "مسؤول" and "مسئول" match each other —
 * they would fold to different words — so it buys nothing and risks collapsing
 * two real words into one.
 */
const LETTER_FOLD: Record<string, string> = {
  [char(0x0623)]: char(0x0627), // أ alef with hamza above -> ا
  [char(0x0625)]: char(0x0627), // إ alef with hamza below -> ا
  [char(0x0622)]: char(0x0627), // آ alef with madda       -> ا
  [char(0x0671)]: char(0x0627), // ٱ alef wasla            -> ا
  [char(0x0629)]: char(0x0647), // ة ta marbuta            -> ه
  [char(0x0649)]: char(0x064a), // ى alef maqsura          -> ي
};

/** Arabic-Indic (٠-٩) and extended Arabic-Indic (۰-۹) digits, folded to ASCII. */
const DIGIT_FOLD: Record<string, string> = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => [
    [char(0x0660 + i), String(i)],
    [char(0x06f0 + i), String(i)],
  ]).flat()
);

const CHARACTER_FOLD: Record<string, string> = { ...LETTER_FOLD, ...DIGIT_FOLD };

const FOLDABLE = classOf(...Object.keys(CHARACTER_FOLD));

/**
 * Tashkeel (the short-vowel marks), the dagger alef, and the tatweel — the
 * decorative stretch used to justify text. All are invisible to a search: a
 * word carrying them is the same word.
 */
const REMOVED_MARKS = classOf(
  range(0x064b, 0x0655), // tashkeel and the combining hamzas
  char(0x0670), //          superscript (dagger) alef
  char(0x0640) //           tatweel
);

export function foldSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(REMOVED_MARKS, "")
    .replace(FOLDABLE, (character) => CHARACTER_FOLD[character]);
}

/** Latin combining marks, which `foldSearchText` deliberately leaves alone. */
const LATIN_MARKS = classOf(range(0x0300, 0x036f));

/**
 * A run of characters the index can be asked about: ASCII alphanumerics, or
 * Arabic letters.
 *
 * Arabic *punctuation* is excluded on purpose. The result of this function is
 * interpolated into a `to_tsquery` string, and what keeps that safe is that no
 * quote, backslash or tsquery operator (`& | ! : * ( )`) can survive the
 * match. The Arabic block holds none of those, but it does hold its own comma,
 * semicolon, question mark and full stop, so the class is letters only. The
 * Arabic-Indic digits are absent for a different reason: they are ASCII by the
 * time this runs.
 */
const WORD = new RegExp(
  `[a-z0-9]+|[${range(0x0621, 0x063a)}${range(0x0641, 0x064a)}${range(
    0x066e,
    0x06d3
  )}${range(0x06fa, 0x06ff)}]+`,
  "g"
);

/**
 * The searchable words of a term.
 *
 * Latin diacritics are stripped here rather than in `foldSearchText`, so they
 * are folded on the query side only. Place names reach the database carrying
 * them — "Al Maḩallah al Kubrá" is in live data — and without this the word
 * splits at the mark into "ma" and "allah". The asymmetry only widens what a
 * query reaches, which is why it is safe to leave out of the stored vector; an
 * index that folded Latin marks too would be better, and is a separate change
 * with its own table rewrite behind it.
 *
 * The `NFD` pass cannot disturb the Arabic: every form that decomposes has
 * already been folded to one that does not.
 */
export function searchWords(value: string): string[] {
  return (
    foldSearchText(value).normalize("NFD").replace(LATIN_MARKS, "").match(WORD) ??
    []
  );
}
