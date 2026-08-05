"use client";

import { Search, X, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

// The search input plus an explicit "Ask AI" affordance. Typing runs the existing
// debounced plain-text search (the default); AI translation fires ONLY on an
// explicit activation — the Ask AI button or Enter — never per keystroke, so a
// scarce free-tier request is never spent on an in-progress query.
export const AiSearchBar = ({
  value,
  onChange,
  onClear,
  onAskAi,
  loading = false,
  error = null,
}) => {
  const query = value || "";
  const canAsk = query.trim().length >= 3 && !loading;

  const ask = () => {
    if (canAsk) onAskAi(query);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      ask();
    }
  };

  return (
    <div className="mx-auto mt-6 max-w-xl">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="group relative flex-1">
          <Search className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-500" />
          <Input
            type="text"
            placeholder="Try “family SUV under $30k, automatic”…"
            value={query}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Search cars — press Enter or Ask AI to search in plain English"
            className="h-14 w-full rounded-xl border border-white/40 bg-white/95 pl-12 pr-12 text-base text-gray-900 shadow-lg placeholder:text-gray-500 focus-visible:border-white focus-visible:ring-4 focus-visible:ring-white/20"
          />
          {query && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={ask}
          disabled={!canAsk}
          aria-label="Ask AI to interpret your search"
          className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-white px-5 text-base font-semibold text-primary shadow-lg transition-all duration-200 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          <span>Ask AI</span>
        </button>
      </div>

      {error && (
        <p className="mt-2 text-left text-sm font-medium text-white/90" role="status">
          {error}
        </p>
      )}
    </div>
  );
};

export default AiSearchBar;
