"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SearchSuggestion, SuggestionFilters } from "@/lib/search/suggest";

/**
 * The buyer's last few committed searches, shown when the search field is
 * focused and empty — kept in this browser's localStorage, so they are this
 * device's and this browser's only: not an account's history, and gone with
 * the site's data. Without storage (a private window, blocked site data) there
 * are none, and nothing else changes.
 *
 * Only committed searches are kept — a submitted query, a chosen suggestion —
 * never the letters typed on the way.
 */

const STORAGE_KEY = "autome:recent-searches";
export const MAX_RECENT_SEARCHES = 5;

export interface RecentSearch {
  /** As the list shows it. */
  label: string;
  /** What choosing it again sets, as a suggestion would. */
  filters?: SuggestionFilters;
  search?: string;
}

/** One key per search, whatever its label: the same filters and text are the same search. */
export function recentSearchKey({ filters, search }: Pick<RecentSearch, "filters" | "search">): string {
  const set = Object.entries(filters ?? {})
    .filter(([, value]) => value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`);
  return [...set, `search=${(search ?? "").trim().toLowerCase()}`].join("&");
}

const isEmpty = (entry: RecentSearch) =>
  !entry.label.trim() || (!entry.search?.trim() && !Object.values(entry.filters ?? {}).some(Boolean));

/** The list with `entry` first: an earlier copy of it removed, at most MAX_RECENT_SEARCHES kept. */
export function withRecentSearch(list: RecentSearch[], entry: RecentSearch): RecentSearch[] {
  if (isEmpty(entry)) return list;
  const key = recentSearchKey(entry);
  const clean: RecentSearch = { label: entry.label.trim(), filters: entry.filters, search: entry.search?.trim() || undefined };
  return [clean, ...list.filter((item) => recentSearchKey(item) !== key)].slice(0, MAX_RECENT_SEARCHES);
}

function read(): RecentSearch[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    // Stored by an earlier version, or edited by hand: keep only what is well formed.
    return parsed
      .filter((item): item is RecentSearch => typeof item?.label === "string" && !isEmpty(item))
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

function write(list: RecentSearch[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage full or blocked: the list lives for this page only.
  }
}

/** A recent search as an option of the search box's list. */
const asOption = (entry: RecentSearch): SearchSuggestion => ({ kind: "recent", label: entry.label, count: 0, filters: entry.filters, search: entry.search });

export function useRecentSearches() {
  const [list, setList] = useState<RecentSearch[]>([]);
  // Read after mounting: the server has no storage, and the first render must match it.
  useEffect(() => setList(read()), []);

  const save = useCallback((entry: RecentSearch) => {
    setList((current) => {
      const next = withRecentSearch(current, entry);
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((entry: Pick<RecentSearch, "filters" | "search">) => {
    const key = recentSearchKey(entry);
    setList((current) => {
      const next = current.filter((item) => recentSearchKey(item) !== key);
      write(next);
      return next;
    });
  }, []);

  const options = useMemo(() => list.map(asOption), [list]);
  return { options, save, remove };
}
