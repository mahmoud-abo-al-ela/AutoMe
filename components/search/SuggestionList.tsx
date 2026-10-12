"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { History, Search, X } from "lucide-react";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import type { SearchSuggestion } from "@/lib/search/suggest";
import { SuggestionLabel } from "./SuggestionLabel";

/**
 * The listbox under a search field (useSuggestionCombobox drives it): each
 * suggestion with what it is and how many cars it leads to — or, with the
 * field empty, the buyer's recent searches. Options are never focused — the
 * field keeps focus, and the highlighted option is announced through
 * aria-activedescendant — and a click must not blur the field first, so
 * everything in the list cancels its mousedown.
 *
 * A recent search's remove button sits beside its option, not inside it: an
 * option holds no control of its own. Keyboard users remove with Delete.
 *
 * Positioned by its parent: render it inside a relatively positioned box
 * around the field.
 */
export function SuggestionList({
  id,
  query,
  suggestions,
  open,
  active,
  optionId,
  onPick,
  onHover,
  onRemove,
  showCounts = true,
  className,
}: {
  id: string;
  /** What the buyer has typed: plain in each label, the rest bold. */
  query: string;
  suggestions: SearchSuggestion[];
  open: boolean;
  active: number;
  optionId: (index: number) => string;
  onPick: (suggestion: SearchSuggestion) => void;
  onHover: (index: number) => void;
  /** Removes a recent search; without it, recents have no remove button. */
  onRemove?: (suggestion: SearchSuggestion, index: number) => void;
  /**
   * The counts are of all public listings. Off where other filters narrow the
   * results, which they would misstate.
   */
  showCounts?: boolean;
  className?: string;
}) {
  const t = useTranslations("common.searchSuggestions");
  const fmt = useFormatters();
  const recents = suggestions.length > 0 && suggestions.every((suggestion) => suggestion.kind === "recent");

  // The arrows can move the highlight past the list's edge on a short screen;
  // it scrolls the list along, so the highlighted option is always seen.
  const activeId = open && active >= 0 ? optionId(active) : null;
  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView?.({ block: "nearest" });
  }, [activeId]);

  return (
    <>
      {/* Always rendered, so a screen reader hears the count change as the buyer types. */}
      <p className="sr-only" aria-live="polite">
        {open ? t("count", { count: suggestions.length, value: fmt.number(suggestions.length) }) : ""}
      </p>
      <ul
        id={id}
        role="listbox"
        aria-label={recents ? t("recent") : t("label")}
        hidden={!open}
        className={cn(
          // Tall enough for all eight suggestions; a short screen scrolls the list instead.
          "absolute inset-x-0 top-full z-30 mt-1.5 max-h-[min(23rem,60dvh)] overflow-y-auto rounded-control border border-border bg-card py-1.5 text-start shadow-lg",
          className
        )}
      >
        {suggestions.map((suggestion, index) => {
          const recent = suggestion.kind === "recent";
          return (
            <li
              key={`${suggestion.kind}:${suggestion.label}`}
              role="presentation"
              onMouseDown={(event) => event.preventDefault()}
              // Moving the mouse highlights, not the list arriving under a resting
              // pointer: a page that scrolls would otherwise steal the keyboard's
              // highlight, and Enter would take whatever slid under the mouse.
              onMouseMove={() => index !== active && onHover(index)}
              className={cn("flex min-h-11 items-center", index === active && "bg-muted")}
            >
              <div
                id={optionId(index)}
                role="option"
                aria-selected={index === active}
                onClick={() => onPick(suggestion)}
                className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3 ps-3.5 pe-2 text-body"
              >
                {recent ? (
                  <History aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                ) : (
                  <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1 truncate">
                  <SuggestionLabel label={suggestion.label} query={query} />
                  {!recent && (
                    <span className="ms-2 text-caption text-muted-foreground">{t(`kind.${suggestion.kind}`)}</span>
                  )}
                </span>
                {showCounts && !recent && (
                  <span className="shrink-0 text-caption text-muted-foreground">
                    {t("cars", { count: suggestion.count, value: fmt.number(suggestion.count) })}
                  </span>
                )}
              </div>
              {recent && onRemove && (
                <button
                  type="button"
                  // Not in the tab order: focus stays in the field, and Delete removes from there.
                  tabIndex={-1}
                  aria-label={t("remove", { label: suggestion.label })}
                  title={t("remove", { label: suggestion.label })}
                  onClick={() => onRemove(suggestion, index)}
                  className="me-1.5 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-plate text-muted-foreground hover:bg-background hover:text-foreground"
                >
                  <X aria-hidden className="size-4" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
