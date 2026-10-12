import type { SpecKind } from "./specs";

/**
 * The search box's suggestions, as the route answers them and the box shows
 * them. Pure — shared by the route, the service and the client.
 */

/** The query is short by design: what a buyer has typed so far. */
export const MAX_SUGGEST_QUERY = 40;

export type SuggestionLocale = "en" | "ar";

export type SuggestionKind = "make" | "model" | SpecKind;

/** The filters choosing a suggestion sets, as the cars page's URL names them. */
export interface SuggestionFilters {
  make?: string;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  color?: string;
}

export interface SearchSuggestion {
  kind: SuggestionKind;
  /** As the list shows it, in the reader's language. */
  label: string;
  /** Public cars it leads to. */
  count: number;
  /** The filters choosing it sets: a make, a body type, a colour… */
  filters?: SuggestionFilters;
  /** The search text choosing it sets: a model, a feature. */
  search?: string;
}

const FILTER_KEYS = ["make", "bodyType", "fuelType", "transmission", "color"] as const;

/** The listing URL's query for a suggestion: its filters, and its text as the search. */
export function suggestionParams(suggestion: Pick<SearchSuggestion, "filters" | "search">): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = suggestion.filters?.[key];
    if (value) params.set(key, value);
  }
  if (suggestion.search) params.set("search", suggestion.search);
  return params;
}
