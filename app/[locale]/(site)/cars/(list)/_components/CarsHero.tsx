"use client";

import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import type { SearchSuggestion } from "@/lib/search/suggest";
import { SuggestionList } from "@/components/search/SuggestionList";
import { useSearchBox } from "@/components/search/use-search-box";

export const CarsHero = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  onPickSuggestion,
  showSuggestionCounts = true,
}: {
  searchQuery?: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onPickSuggestion: (suggestion: SearchSuggestion) => void;
  showSuggestionCounts?: boolean;
}) => {
  const t = useTranslations("cars");
  const query = searchQuery || "";
  const { options, combobox, remember } = useSearchBox(query, onPickSuggestion);

  return (
    <header className="mb-6 flex flex-col gap-5 border-b border-border pb-6 lg:mb-8">
      <h1 className="text-h1 font-extrabold">{t("browse.title")}</h1>

      {/* z-40: its suggestions open over the sticky results toolbar (z-30) and stay under the site header (z-50). */}
      <div className="relative z-40 w-full lg:max-w-xl">
        <Search aria-hidden className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          {...combobox.inputProps}
          onKeyDown={(event) => {
            combobox.inputProps.onKeyDown(event);
            // The field searches as it is typed; Enter is where a search is meant, so it is remembered.
            if (event.key === "Enter" && !event.defaultPrevented && query.trim()) remember(query.trim());
          }}
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
        <SuggestionList query={query} suggestions={options} showCounts={showSuggestionCounts} {...combobox.listProps} />
      </div>
    </header>
  );
};

export default CarsHero;
