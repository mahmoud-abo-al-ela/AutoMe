import type { TextSearchFilters } from "@/lib/services/ai/textSearchFilters";

const CUES =
  /\b(under|over|below|above|less|more|max|min|budget|between|from|newer|older|seater|seats?|k|million|thousand|egp|pounds?)\b|\d+\s*k\b|تحت|أقل|اقل|أكثر|اكثر|فوق|مليون|ألف|الف|ميزانية|ميزانيتي|جنيه|لحد|وطالع|راكب|مقاعد/i;

export function readsLikeSentence(query: string): boolean {
  const words = query.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 4) return true;
  return words.length >= 2 && CUES.test(query);
}

/** The listing URL's query for these filters; the keywords become its text search. */
export function describedSearchParams(filters: TextSearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  const { keywords, ...rest } = filters;
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  if (keywords) params.set("search", keywords);
  return params;
}

/** Whether the model found any filter at all — otherwise the plain text search is as good. */
export function hasFilters(filters: TextSearchFilters): boolean {
  return Object.keys(filters).some((key) => key !== "keywords");
}
