"use client";

import { useState } from "react";
import { Car, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FilterSection } from "./FilterSection";
import { FilterChip } from "./FilterChip";
import type { MultiFacetProps } from "../../_lib/cars-types";
import { useTranslations } from "next-intl";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import { useFormatters } from "@/hooks/use-formatters";

const COLLAPSED_COUNT = 12;

const MakesFilter = ({
  selected = [],
  options = [],
  onToggle,
  isLoading,
}: MultiFacetProps) => {
  const t = useTranslations("cars.filters");
  const fmt = useFormatters();
  const attr = useCarAttributes();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const matches = (value: string) => {
    const needle = query.toLowerCase();
    return (
      value.toLowerCase().includes(needle) ||
      attr.make(value).toLowerCase().includes(needle)
    );
  };
  const filtered = query ? options.filter((o) => matches(o.value)) : options;
  const visible = expanded ? filtered : filtered.slice(0, COLLAPSED_COUNT);
  const hiddenCount = filtered.length - visible.length;

  return (
    <FilterSection
      value="makes"
      icon={Car}
      label={t("makes")}
      count={selected.length}
      isEmpty={options.length === 0}
      emptyLabel={t("makesEmpty")}
    >
      {options.length > COLLAPSED_COUNT && (
        <div className="relative mb-2">
          <Search className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchMakes")}
            className="h-8 ps-8 text-xs"
            aria-label={t("searchMakesLabel")}
          />
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 pt-1 pb-2">
        {visible.map(({ value, count }) => (
          <FilterChip
            key={value}
            label={attr.make(value)}
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
            {t("showMore", { value: fmt.number(hiddenCount) })}
          </button>
        )}
        {expanded && filtered.length > COLLAPSED_COUNT && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="rounded-full px-2 text-xs font-medium text-muted-foreground hover:underline"
          >
            {t("showLess")}
          </button>
        )}
      </div>
    </FilterSection>
  );
};

export default MakesFilter;
