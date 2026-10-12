"use client";

import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import type { SearchSuggestion } from "@/lib/search/suggest";
import { SuggestionList } from "@/components/search/SuggestionList";
import { useSearchSuggestions } from "@/components/search/use-search-suggestions";
import { useSuggestionCombobox } from "@/components/search/use-suggestion-combobox";

/**
 * Browse page header (Figma: Browse — desktop). Replaces the animated gradient
 * hero, which pushed the first result ~180px further down: a title and the
 * search field — then straight into results. Suggestions open under the
 * field as the buyer types; choosing one applies it (onPickSuggestion).
 */
export const CarsHero = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  onPickSuggestion,
}: {
  searchQuery?: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onPickSuggestion: (suggestion: SearchSuggestion) => void;
}) => {
  const t = useTranslations("cars");
  const query = searchQuery || "";
  const suggestions = useSearchSuggestions(query);
  const combobox = useSuggestionCombobox(suggestions, onPickSuggestion);

  return (
    <header className="mb-6 flex flex-col gap-5 border-b border-border pb-6 lg:mb-8">
      <h1 className="text-h1 font-extrabold">{t("browse.title")}</h1>

      <div className="relative w-full lg:max-w-xl">
        <Search aria-hidden className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          {...combobox.inputProps}
          value={query}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("hero.searchPlaceholder")}
          aria-label={t("hero.searchLabel")}
          className="h-12 w-full rounded-control border border-border bg-field ps-12 pe-12 text-body outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={onClearSearch}
            aria-label={t("hero.clearSearch")}
            title={t("hero.clearSearch")}
            className="absolute end-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-plate text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
        <SuggestionList suggestions={suggestions} {...combobox.listProps} />
      </div>
    </header>
  );
};

export default CarsHero;
