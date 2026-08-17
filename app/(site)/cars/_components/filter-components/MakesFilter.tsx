"use client";

import { useState } from "react";
import { Car, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FilterSection } from "./FilterSection";
import { FilterChip } from "./FilterChip";
import type { MultiFacetProps } from "../../_lib/cars-types";

const COLLAPSED_COUNT = 12;

const MakesFilter = ({
  selected = [],
  options = [],
  onToggle,
  isLoading,
}: MultiFacetProps) => {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = query
    ? options.filter((o) => o.value.toLowerCase().includes(query.toLowerCase()))
    : options;
  const visible = expanded ? filtered : filtered.slice(0, COLLAPSED_COUNT);
  const hiddenCount = filtered.length - visible.length;

  return (
    <FilterSection
      value="makes"
      icon={Car}
      label="Makes"
      count={selected.length}
      isEmpty={options.length === 0}
      emptyLabel="No makes available"
    >
      {options.length > COLLAPSED_COUNT && (
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search makes..."
            className="h-8 pl-8 text-xs"
            aria-label="Search makes"
          />
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 pt-1 pb-2">
        {visible.map(({ value, count }) => (
          <FilterChip
            key={value}
            label={value}
            count={count}
            selected={selected.includes(value)}
            disabled={isLoading}
            onClick={() => onToggle(value)}
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
        {expanded && filtered.length > COLLAPSED_COUNT && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="rounded-full px-2 text-xs font-medium text-muted-foreground hover:underline"
          >
            Show less
          </button>
        )}
      </div>
    </FilterSection>
  );
};

export default MakesFilter;
