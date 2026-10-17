"use client";

import type { SearchSuggestion } from "@/lib/search/suggest";
import { useRecentSearches } from "./use-recent-searches";
import { useSearchSuggestions } from "./use-search-suggestions";
import { useSuggestionCombobox } from "./use-suggestion-combobox";

export function useSearchBox(query: string, onPick: (suggestion: SearchSuggestion) => void) {
  const recent = useRecentSearches();
  const suggestions = useSearchSuggestions(query);
  const options = query.trim() ? suggestions : recent.options;

  const combobox = useSuggestionCombobox(
    options,
    (suggestion) => {
      recent.save({ label: suggestion.label, filters: suggestion.filters, search: suggestion.search });
      onPick(suggestion);
    },
    { onRemove: (suggestion) => recent.remove(suggestion) }
  );

  return {
    options,
    combobox,
    /** Remember a submitted query as a recent search. */
    remember: (text: string) => recent.save({ label: text, search: text }),
  };
}
