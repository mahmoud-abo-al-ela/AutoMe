import { foldSearchCharacter, searchCharKind, searchWords } from "@/lib/utils/search-text";

/**
 * Where a search's words are in a piece of text, for marking them — found the
 * way the search finds them. The search folds both sides (tashkeel and tatweel
 * gone, أ/إ/آ → ا, ة → ه, ى → ي, Arabic digits → ASCII, case, Latin accents),
 * so "سياره" matches "سيارة" and "corolla" matches "COROLLA"; the marks must
 * land on the text as written, not on its folded copy.
 *
 * So the text is folded a character at a time, keeping for every folded
 * character the span of the original it came from. Folding can drop a
 * character (a mark) or grow one ("İ" lowercases to two), so offsets in the
 * folded copy are not offsets in the text; the map is what makes the ranges
 * land on whole characters of the original — never inside a surrogate pair.
 */

export interface TextRange {
  /** UTF-16 offsets into the original text, end exclusive. */
  start: number;
  end: number;
}

interface FoldedText {
  folded: string;
  /** For each UTF-16 unit of `folded`, the original character it came from. */
  source: TextRange[];
}

function foldWithMap(text: string): FoldedText {
  let folded = "";
  const source: TextRange[] = [];
  let offset = 0;
  for (const character of text) {
    const end = offset + character.length;
    const out = foldSearchCharacter(character);
    folded += out;
    for (let i = 0; i < out.length; i++) source.push({ start: offset, end });
    offset = end;
  }
  return { folded, source };
}

/** Where words start in folded text: a word character after a different kind, or at the start. */
function isWordStart(folded: string, i: number): boolean {
  const kind = searchCharKind(folded[i]);
  return kind !== null && (i === 0 || searchCharKind(folded[i - 1]) !== kind);
}

/** The original span of folded characters [from, to). */
const spanOf = (map: FoldedText, from: number, to: number): TextRange => ({
  start: map.source[from].start,
  end: map.source[to - 1].end,
});

/**
 * The ranges of `text` that `words` match, as the search matches them: each
 * word (folded, as `searchWords` returns it) at the start of a word of the
 * text, by prefix — "cor" marks "Cor" in "Corolla". Sorted, overlaps merged.
 */
export function highlightRanges(text: string, words: string[]): TextRange[] {
  const wanted = [...new Set(words.flatMap((word) => searchWords(word)))];
  if (!text || wanted.length === 0) return [];

  const map = foldWithMap(text);
  const found: TextRange[] = [];
  for (let i = 0; i < map.folded.length; i++) {
    if (!isWordStart(map.folded, i)) continue;
    // The longest word that matches here, so "cor" and "corolla" mark "Corolla" once.
    const longest = wanted.filter((word) => map.folded.startsWith(word, i)).sort((a, b) => b.length - a.length)[0];
    if (longest) found.push(spanOf(map, i, i + longest.length));
  }

  found.sort((a, b) => a.start - b.start);
  const merged: TextRange[] = [];
  for (const range of found) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push({ ...range });
  }
  return merged;
}

/** The text cut into runs, each marked or not, for rendering as text nodes. */
export function splitByRanges(text: string, ranges: TextRange[]): { text: string; marked: boolean }[] {
  const parts: { text: string; marked: boolean }[] = [];
  let at = 0;
  for (const { start, end } of ranges) {
    if (start > at) parts.push({ text: text.slice(at, start), marked: false });
    parts.push({ text: text.slice(start, end), marked: true });
    at = end;
  }
  if (at < text.length) parts.push({ text: text.slice(at), marked: false });
  return parts;
}

/**
 * A word as one of `texts` spells it — the whole word whose folded form is
 * `word` — or null when none has it. The vocabulary holds words folded for
 * search ("فتحه"); a buyer must read them as written ("فتحة").
 */
export function writtenForm(word: string, texts: (string | null | undefined)[]): string | null {
  const [wanted] = searchWords(word);
  if (!wanted) return null;
  for (const text of texts) {
    if (!text) continue;
    const map = foldWithMap(text);
    for (let i = 0; i < map.folded.length; i++) {
      const end = i + wanted.length;
      if (!isWordStart(map.folded, i) || !map.folded.startsWith(wanted, i)) continue;
      // The whole word, not the start of a longer one.
      if (end < map.folded.length && searchCharKind(map.folded[end]) === searchCharKind(wanted[0])) continue;
      const { start, end: last } = spanOf(map, i, end);
      return text.slice(start, last);
    }
  }
  return null;
}
