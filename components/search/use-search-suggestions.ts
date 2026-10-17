"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { queryKeys } from "@/lib/query-client";
import { MAX_SUGGEST_QUERY, type SearchSuggestion } from "@/lib/search/suggest";

/** Typing pauses this long before the box asks: a request per pause, not per key. */
const DEBOUNCE_MS = 150;
/** One empty list, so "no suggestions" is the same list from render to render. */
const NONE: SearchSuggestion[] = [];

async function fetchSuggestions(query: string, locale: string, signal: AbortSignal): Promise<SearchSuggestion[]> {
  const response = await fetch(`/api/search/suggest?${new URLSearchParams({ q: query, locale })}`, { signal });
  // Suggestions only help: a refusal (too many, unavailable) shows none.
  if (!response.ok) return [];
  const body = (await response.json()) as { suggestions?: SearchSuggestion[] };
  return body.suggestions ?? [];
}

export function useSearchSuggestions(query: string): SearchSuggestion[] {
  const locale = useLocale();
  const [settled, setSettled] = useState(query);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const typed = settled.trim();
  const enabled = typed.length > 0 && typed.length <= MAX_SUGGEST_QUERY;
  const { data } = useQuery({
    queryKey: queryKeys.cars.suggestions(locale, typed),
    queryFn: ({ signal }) => fetchSuggestions(typed, locale, signal),
    enabled,
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });
  return enabled && query.trim() ? (data ?? NONE) : NONE;
}
