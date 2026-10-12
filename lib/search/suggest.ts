/**
 * The search box's suggestions, as the route answers them and the box shows
 * them. Pure — shared by the route, the service and the client.
 */

/** The query is short by design: what a buyer has typed so far. */
export const MAX_SUGGEST_QUERY = 40;

export type SuggestionLocale = "en" | "ar";

export interface SearchSuggestion {
  kind: "make" | "model" | "word";
  /** As the list shows it, in the reader's language. */
  label: string;
  /** Public cars it leads to. */
  count: number;
  /** What choosing it sets: the make filter, the search text, or both. */
  make?: string;
  search?: string;
}

/** The listing URL's query for a suggestion: its make as a filter, its text as the search. */
export function suggestionParams(suggestion: Pick<SearchSuggestion, "make" | "search">): URLSearchParams {
  const params = new URLSearchParams();
  if (suggestion.make) params.set("make", suggestion.make);
  if (suggestion.search) params.set("search", suggestion.search);
  return params;
}
