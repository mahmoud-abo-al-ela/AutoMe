import arCarAttributes from "@/messages/ar/carAttributes.json";
import * as carRepository from "@/lib/repositories/car";
import type { MakeModelCount, SpecCount } from "@/lib/repositories/car";
import { searchWords } from "@/lib/utils/search-text";
import { SPECS } from "@/lib/search/specs";
import type { SearchSuggestion, SuggestionLocale } from "@/lib/search/suggest";

export const MAX_SUGGESTIONS = 8;
/** How many of a category are taken before the others have had their turn. */
const CAPS = { make: 3, model: 4, spec: 3 } as const;
/** How long one instance reuses the public counts. */
const COUNTS_TTL_MS = 60_000;

type Category = keyof typeof CAPS;
const CATEGORY_ORDER: Category[] = ["make", "model", "spec"];

const AR_MAKES: Record<string, string> = arCarAttributes.make;

const fold = (value: string) => searchWords(value).join(" ");

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
