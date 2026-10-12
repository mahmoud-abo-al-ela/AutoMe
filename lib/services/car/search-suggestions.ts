import arCarAttributes from "@/messages/ar/carAttributes.json";
import * as carRepository from "@/lib/repositories/car";
import type { MakeModelCount, WordCount } from "@/lib/repositories/car";
import { searchWords } from "@/lib/utils/search-text";
import type { SearchSuggestion, SuggestionLocale } from "@/lib/search/suggest";

/**
 * What the search box suggests as a buyer types: makes, by their name in
 * either language ("تو" → تويوتا), make-and-model pairs ("toyota cor" →
 * Toyota Corolla), then words the listings use. Each with how many public cars
 * it leads to. Nothing depends on who is asking — public listings only — so
 * the route may let a CDN share the answer between buyers.
 */

export const MAX_SUGGESTIONS = 8;
/** Vocabulary words fetched per query, before the ones already suggested are dropped. */
const WORD_CANDIDATES = 10;
/** How long one instance reuses the make-and-model counts. */
const PAIRS_TTL_MS = 60_000;

const AR_MAKES: Record<string, string> = arCarAttributes.make;
const LATIN_WORD = /^\p{Script=Latin}[\p{Script=Latin}\d]*$/u;

const fold = (value: string) => searchWords(value).join(" ");

/**
 * The suggestions for a query, from the public make-and-model counts and the
 * vocabulary words that complete it. Pure: the service fetches, this decides.
 */
export function matchSuggestions(
  query: string,
  locale: SuggestionLocale,
  pairs: MakeModelCount[],
  words: WordCount[]
): SearchSuggestion[] {
  const typed = fold(query);
  if (!typed) return [];

  const shown = (make: string) => (locale === "ar" && AR_MAKES[make]) || make;
  const names = (make: string) => [make, AR_MAKES[make]].filter(Boolean).map(fold);
  const byCount = (a: { count: number; label: string }, b: { count: number; label: string }) =>
    b.count - a.count || a.label.localeCompare(b.label, locale);

  const perMake = new Map<string, number>();
  for (const pair of pairs) perMake.set(pair.make, (perMake.get(pair.make) ?? 0) + pair.count);

  const makes: SearchSuggestion[] = [...perMake]
    .filter(([make]) => names(make).some((name) => name.startsWith(typed)))
    .map(([make, count]) => ({ kind: "make" as const, label: shown(make), count, make }))
    .sort(byCount);

  const models: SearchSuggestion[] = pairs
    .filter(({ make, model }) => {
      if (!model) return false;
      const folded = fold(model);
      return folded.startsWith(typed) || names(make).some((name) => `${name} ${folded}`.startsWith(typed));
    })
    // A make is translated only on its own: beside a model, which stays Latin,
    // it keeps its English name, as a car's title does (useCarAttributes).
    .map(({ make, model, count }) => ({ kind: "model" as const, label: `${make} ${model}`, count, make, search: model }))
    .sort(byCount);

  const named = new Set([...makes, ...models].flatMap((s) => [fold(s.label), fold(s.search ?? s.make ?? "")]));
  const completions: SearchSuggestion[] = words
    .filter(({ word }) => word !== typed && !named.has(word))
    .map(({ word, count }) => ({ kind: "word" as const, label: word, count, search: word }));

  const seen = new Set<string>();
  return [...makes, ...models, ...completions]
    .filter((suggestion) => {
      const key = `${suggestion.make ?? ""}|${fold(suggestion.search ?? "")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_SUGGESTIONS);
}

let pairsCache: { at: number; rows: Promise<MakeModelCount[]> } | null = null;

/**
 * The public make-and-model counts, reused for a minute by this instance: a
 * buyer typing asks once per pause, and the counts barely move in a minute.
 */
function publicMakeModels(now = Date.now()): Promise<MakeModelCount[]> {
  if (!pairsCache || now - pairsCache.at > PAIRS_TTL_MS) {
    const rows = carRepository.countPublicMakeModels();
    pairsCache = { at: now, rows };
    // A failed read must not be served to the next minute's buyers.
    rows.catch(() => {
      if (pairsCache?.rows === rows) pairsCache = null;
    });
  }
  return pairsCache.rows;
}

/**
 * Suggestions for what a buyer has typed so far. Word completions are offered
 * for a single Latin word only: the vocabulary holds words folded for search,
 * and an Arabic word shown folded ("فتحه" for "فتحة") would read as a
 * misspelling. Arabic makes come from their display names, spelled right.
 */
export async function suggestSearches(query: string, locale: SuggestionLocale): Promise<SearchSuggestion[]> {
  const tokens = searchWords(query);
  if (tokens.length === 0) return [];
  const completing = tokens.length === 1 && LATIN_WORD.test(tokens[0]) && tokens[0].length >= 2 ? tokens[0] : null;

  const [pairs, words] = await Promise.all([
    publicMakeModels(),
    completing ? carRepository.findWordsByPrefix(completing, WORD_CANDIDATES) : Promise.resolve([]),
  ]);
  return matchSuggestions(query, locale, pairs, words);
}

/** Test seam: forget the cached counts. */
export function resetSuggestionsForTests(): void {
  pairsCache = null;
}
