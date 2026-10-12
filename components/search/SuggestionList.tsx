"use client";

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import type { SearchSuggestion } from "@/lib/search/suggest";

/**
 * The listbox under a search field (useSuggestionCombobox drives it): each
 * suggestion with what it is and how many cars it leads to. Options are never
 * focused — the field keeps focus, and the highlighted option is announced
 * through aria-activedescendant — and a click must not blur the field first,
 * so each option cancels its mousedown.
 *
 * Positioned by its parent: render it inside a relatively positioned box
 * around the field.
 */
export function SuggestionList({
  id,
  suggestions,
  open,
  active,
  optionId,
  onPick,
  onHover,
  showCounts = true,
  className,
}: {
  id: string;
  suggestions: SearchSuggestion[];
  open: boolean;
  active: number;
  optionId: (index: number) => string;
  onPick: (suggestion: SearchSuggestion) => void;
  onHover: (index: number) => void;
  /**
   * The counts are of all public listings. Off where other filters narrow the
   * results, which they would misstate.
   */
  showCounts?: boolean;
  className?: string;
}) {
  const t = useTranslations("common.searchSuggestions");
  const fmt = useFormatters();

  return (
    <>
      {/* Always rendered, so a screen reader hears the count change as the buyer types. */}
      <p className="sr-only" aria-live="polite">
        {open ? t("count", { count: suggestions.length, value: fmt.number(suggestions.length) }) : ""}
      </p>
      <ul
        id={id}
        role="listbox"
        aria-label={t("label")}
        hidden={!open}
        className={cn(
          "absolute inset-x-0 top-full z-30 mt-1.5 max-h-80 overflow-y-auto rounded-control border border-border bg-card py-1.5 text-start shadow-lg",
          className
        )}
      >
        {suggestions.map((suggestion, index) => (
          <li
            key={`${suggestion.kind}:${suggestion.label}`}
            id={optionId(index)}
            role="option"
            aria-selected={index === active}
            onMouseDown={(event) => event.preventDefault()}
            // Moving the mouse highlights, not the list arriving under a resting
            // pointer: a page that scrolls would otherwise steal the keyboard's
            // highlight, and Enter would take whatever slid under the mouse.
            onMouseMove={() => index !== active && onHover(index)}
            onClick={() => onPick(suggestion)}
            className={cn(
              "flex min-h-11 cursor-pointer items-center gap-3 px-3.5 text-body",
              index === active && "bg-muted"
            )}
          >
            <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">
              <bdi className="font-medium">{suggestion.label}</bdi>
              <span className="ms-2 text-caption text-muted-foreground">{t(`kind.${suggestion.kind}`)}</span>
            </span>
            {showCounts && (
              <span className="shrink-0 text-caption text-muted-foreground">
                {t("cars", { count: suggestion.count, value: fmt.number(suggestion.count) })}
              </span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
