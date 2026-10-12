"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { SearchSuggestion } from "@/lib/search/suggest";

/**
 * Where the highlighted option moves for a key, in a list of `count`: down
 * from the field to the first option and around, up to the last and around.
 * -1 is the field itself, nothing highlighted. Null for any other key.
 */
export function nextActive(active: number, key: string, count: number): number | null {
  if (count === 0) return null;
  if (key === "ArrowDown") return active >= count - 1 ? 0 : active + 1;
  if (key === "ArrowUp") return active <= 0 ? count - 1 : active - 1;
  return null;
}

/**
 * A search field as a WAI-ARIA combobox over its suggestions: arrows move
 * through them while focus stays in the field, Enter takes the highlighted
 * one (or, with none highlighted, does what the field always did), Escape
 * closes the list and keeps the text, Tab and leaving the field close it.
 * Delete on a highlighted recent search removes it (`onRemove`) — the field
 * is empty while recents show, so no text is being edited.
 */
export function useSuggestionCombobox(
  suggestions: SearchSuggestion[],
  onPick: (suggestion: SearchSuggestion) => void,
  { onRemove }: { onRemove?: (suggestion: SearchSuggestion) => void } = {}
) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // After a removal, the highlight stays where it was rather than resetting.
  const keepActive = useRef<number | null>(null);

  // A new list starts with nothing highlighted, so Enter still searches the text.
  useEffect(() => {
    setActive(keepActive.current ?? -1);
    keepActive.current = null;
  }, [suggestions]);

  const shown = open && suggestions.length > 0;
  const optionId = (index: number) => `${listId}-option-${index}`;

  const pick = (suggestion: SearchSuggestion) => {
    setOpen(false);
    setActive(-1);
    onPick(suggestion);
  };

  const remove = (suggestion: SearchSuggestion, index: number) => {
    keepActive.current = Math.min(index, suggestions.length - 2);
    onRemove?.(suggestion);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      if (shown) event.preventDefault();
      setOpen(false);
      setActive(-1);
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter" && shown && active >= 0) {
      event.preventDefault();
      pick(suggestions[active]);
      return;
    }
    if (event.key === "Delete" && shown && active >= 0 && suggestions[active].kind === "recent" && onRemove) {
      event.preventDefault();
      remove(suggestions[active], active);
      return;
    }
    const next = nextActive(active, event.key, suggestions.length);
    if (next !== null) {
      event.preventDefault();
      setOpen(true);
      setActive(next);
    }
  };

  return {
    inputProps: {
      role: "combobox" as const,
      "aria-autocomplete": "list" as const,
      "aria-expanded": shown,
      "aria-controls": listId,
      "aria-activedescendant": shown && active >= 0 ? optionId(active) : undefined,
      onKeyDown,
      onFocus: () => setOpen(true),
      // An option cancels its mousedown (SuggestionList), so a click keeps focus
      // here: a blur is always the buyer leaving the field.
      onBlur: () => setOpen(false),
      onInput: () => setOpen(true),
    },
    listProps: {
      id: listId,
      open: shown,
      active,
      optionId,
      onPick: pick,
      onHover: setActive,
      onRemove: onRemove ? remove : undefined,
    },
  };
}
