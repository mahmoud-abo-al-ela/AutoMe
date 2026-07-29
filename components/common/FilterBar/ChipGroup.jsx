"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FilterChip } from "./FilterChip";

const COLLAPSED_COUNT = 12;

/**
 * A wrap of accessible FilterChips with an optional search box (auto-shown when
 * there are more than `collapseAt` options) and "+N more" / "Show less"
 * expansion. Works for both single-select (pass a one-element selectedValues)
 * and multi-select — selection semantics are decided by the caller's onToggle.
 *
 * options: [{ value, label?, count? }]
 */
export const ChipGroup = ({
  options = [],
  selectedValues = [],
  onToggle,
  searchPlaceholder = "Search...",
  emptyLabel = "No options available",
  disabled = false,
  collapseAt = COLLAPSED_COUNT,
  searchable = true,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  if (options.length === 0) {
    return <p className="px-1 py-2 text-xs text-muted-foreground">{emptyLabel}</p>;
  }

  const canSearch = searchable && options.length > collapseAt;
  const filtered = query
    ? options.filter((o) => (o.label || o.value).toLowerCase().includes(query.toLowerCase()))
    : options;
  const visible = expanded ? filtered : filtered.slice(0, collapseAt);
  const hiddenCount = filtered.length - visible.length;

  return (
    <div>
      {canSearch && (
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-8 pl-8 text-xs"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {visible.map((o) => (
          <FilterChip
            key={o.value}
            label={o.label || o.value}
            count={o.count}
            selected={selectedValues.includes(o.value)}
            disabled={disabled}
            onClick={() => onToggle(o.value)}
          />
        ))}

        {!expanded && hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="rounded-full px-2 text-xs font-medium text-primary hover:underline"
          >
            +{hiddenCount} more
          </button>
        )}
        {expanded && filtered.length > collapseAt && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="rounded-full px-2 text-xs font-medium text-muted-foreground hover:underline"
          >
            Show less
          </button>
        )}
        {query && filtered.length === 0 && (
          <p className="py-1 text-xs text-muted-foreground">No matches</p>
        )}
      </div>
    </div>
  );
};

export default ChipGroup;
