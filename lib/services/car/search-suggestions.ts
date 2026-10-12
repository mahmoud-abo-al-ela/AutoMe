import arCarAttributes from "@/messages/ar/carAttributes.json";
import * as carRepository from "@/lib/repositories/car";
import type { MakeModelCount, SpecCount } from "@/lib/repositories/car";
import { searchWords } from "@/lib/utils/search-text";
import { SPECS } from "@/lib/search/specs";
import type { SearchSuggestion, SuggestionLocale } from "@/lib/search/suggest";

/**
 * What the search box suggests as a buyer types: makes, by their name in
 * either language ("تو" → تويوتا), make-and-model pairs ("toyota cor" →
 * Toyota Corolla), and specs — body type, fuel, gearbox, colour, features
 * ("sed" → Sedan, "فتح" → فتحة سقف). Each with how many public cars it leads
 * to. Nothing depends on who is asking — public listings only — so the route
 * may let a CDN share the answer between buyers.
 */

export const MAX_SUGGESTIONS = 8;
/** How many of a category are taken before the others have had their turn. */
const CAPS = { make: 3, model: 4, spec: 3 } as const;
/** How long one instance reuses the public counts. */
const COUNTS_TTL_MS = 60_000;

type Category = keyof typeof CAPS;
const CATEGORY_ORDER: Category[] = ["make", "model", "spec"];

const AR_MAKES: Record<string, string> = arCarAttributes.make;

const fold = (value: string) => searchWords(value).join(" ");

/**
 * How well any of a suggestion's names matches what was typed, both folded:
 * 0 — a name is exactly it; 1 — a name starts with it; 2 — a later word of a
 * name does ("cruiser" → Land Cruiser). Null: no match. Never inside a word,
 * as the search itself never matches there.
 */
export function matchQuality(names: string[], typed: string): 0 | 1 | 2 | null {
  if (names.some((name) => name === typed)) return 0;
  if (names.some((name) => name.startsWith(typed))) return 1;
  if (names.some((name) => ` ${name}`.includes(` ${typed}`))) return 2;
  return null;
}

interface Candidate {
  suggestion: SearchSuggestion;
  category: Category;
  quality: 0 | 1 | 2;
  /** Ties broken last by this, so the order never depends on the database's. */
  key: string;
}

/**
 * The suggestions for a query, from the public counts. Pure: the service
 * fetches, this decides.
 *
 * Order: how well a name matches, then makes before models before specs, then
 * the most cars, then the label. Up to eight: every exact match first, then
 * at most CAPS of each category in that order, then whatever is left — so a
 * good make or model is never pushed out by a weaker spec, and specs still get
 * a place beside many models. A category with no match simply yields its
 * places.
 */
export function matchSuggestions(
  query: string,
  locale: SuggestionLocale,
  pairs: MakeModelCount[],
  specs: SpecCount[]
): SearchSuggestion[] {
  const typed = fold(query);
  if (!typed) return [];

  const candidates: Candidate[] = [];
  const consider = (category: Category, names: string[], suggestion: SearchSuggestion, key: string) => {
    if (suggestion.count <= 0) return;
    const quality = matchQuality(names.map(fold).filter(Boolean), typed);
    if (quality !== null) candidates.push({ suggestion, category, quality, key });
  };

  const perMake = new Map<string, number>();
  for (const pair of pairs) perMake.set(pair.make, (perMake.get(pair.make) ?? 0) + pair.count);
  for (const [make, count] of perMake) {
    const label = (locale === "ar" && AR_MAKES[make]) || make;
    consider("make", [make, AR_MAKES[make] ?? ""], { kind: "make", label, count, filters: { make } }, `make:${make}`);
  }

  for (const { make, model, count } of pairs) {
    if (!model) continue;
    const names = [model, `${make} ${model}`, AR_MAKES[make] ? `${AR_MAKES[make]} ${model}` : ""];
    // A make is translated only on its own: beside a model, which stays Latin,
    // it keeps its English name, as a car's title does (useCarAttributes).
    const suggestion: SearchSuggestion = { kind: "model", label: `${make} ${model}`, count, filters: { make }, search: model };
    consider("model", names, suggestion, `model:${make}:${model}`);
  }

  const specCount = new Map(specs.map(({ kind, value, count }) => [`${kind}:${value}`, count]));
  for (const spec of SPECS) {
    const label = locale === "ar" ? spec.ar : spec.en;
    const count = specCount.get(`${spec.kind}:${spec.value}`) ?? 0;
    const suggestion: SearchSuggestion =
      spec.kind === "feature"
        ? { kind: "feature", label, count, search: label }
        : { kind: spec.kind, label, count, filters: { [spec.kind]: spec.value } };
    consider("spec", [spec.en, spec.ar], suggestion, `${spec.kind}:${spec.value}`);
  }

  const order = (a: Candidate, b: Candidate) =>
    a.quality - b.quality ||
    CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
    b.suggestion.count - a.suggestion.count ||
    a.suggestion.label.localeCompare(b.suggestion.label, locale) ||
    a.key.localeCompare(b.key);

  // Two stored values can share a name in one language (Pickup and Pickup
  // Truck are both "بيك أب"): one suggestion each, the one with more cars.
  const seen = new Set<string>();
  const ranked = candidates.sort(order).filter(({ suggestion }) => {
    const shown = `${suggestion.kind}|${fold(suggestion.label)}`;
    if (seen.has(shown)) return false;
    seen.add(shown);
    return true;
  });

  const chosen = new Set<Candidate>();
  const taken = { make: 0, model: 0, spec: 0 };
  const take = (candidate: Candidate) => {
    chosen.add(candidate);
    taken[candidate.category]++;
  };
  for (const c of ranked) if (chosen.size < MAX_SUGGESTIONS && c.quality === 0) take(c);
  for (const c of ranked) {
    if (chosen.size < MAX_SUGGESTIONS && !chosen.has(c) && taken[c.category] < CAPS[c.category]) take(c);
  }
  for (const c of ranked) if (chosen.size < MAX_SUGGESTIONS && !chosen.has(c)) take(c);

  return ranked.filter((c) => chosen.has(c)).map((c) => c.suggestion);
}

/**
 * A count read, reused for a minute by this instance: a buyer typing asks
 * once per pause, and the counts barely move in a minute. A failed read is
 * forgotten at once, never served to the next minute's buyers.
 */
function cachedFor<T>(load: () => Promise<T>) {
  let entry: { at: number; value: Promise<T> } | null = null;
  return {
    get(now = Date.now()): Promise<T> {
      if (!entry || now - entry.at > COUNTS_TTL_MS) {
        const value = load();
        entry = { at: now, value };
        value.catch(() => {
          if (entry?.value === value) entry = null;
        });
      }
      return entry.value;
    },
    reset() {
      entry = null;
    },
  };
}

const publicMakeModels = cachedFor(() => carRepository.countPublicMakeModels());
const publicSpecs = cachedFor(() =>
  carRepository.countPublicSpecs(
    SPECS.filter((spec) => spec.kind === "color").map((spec) => spec.value),
    SPECS.filter((spec) => spec.kind === "feature").map((spec) => spec.value)
  )
);

/** Suggestions for what a buyer has typed so far. */
export async function suggestSearches(query: string, locale: SuggestionLocale): Promise<SearchSuggestion[]> {
  if (searchWords(query).length === 0) return [];
  const [pairs, specs] = await Promise.all([publicMakeModels.get(), publicSpecs.get()]);
  return matchSuggestions(query, locale, pairs, specs);
}

/** Test seam: forget the cached counts. */
export function resetSuggestionsForTests(): void {
  publicMakeModels.reset();
  publicSpecs.reset();
}
