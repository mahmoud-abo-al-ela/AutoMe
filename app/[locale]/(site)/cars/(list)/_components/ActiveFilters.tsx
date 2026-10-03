"use client";

import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import type { CarsActiveFilter, CarsHandlers } from "../_lib/cars-types";

/**
 * What is narrowing the results, each removable (Figma: Chip / Token). The
 * label names the filter type as well as the value, so "Automatic" reads as
 * "Gearbox: Automatic" and two numeric ranges can't be confused.
 */
export const ActiveFilters = ({
  filters,
  onClearFilter,
}: {
  filters: CarsActiveFilter[];
  onClearFilter: CarsHandlers["clearFilter"];
}) => {
  const t = useTranslations("cars");
  // Every filter type has a label under cars.activeFilters; an unknown type
  // falls back to no prefix rather than rendering a raw key path.
  const typeLabel = (type: string) => (t.has(`activeFilters.${type}`) ? t(`activeFilters.${type}`) : "");

  if (!filters || filters.length === 0) return null;

  return (
    <ul className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => {
        const prefix = typeLabel(filter.type);
        return (
          <li key={`${filter.type}-${filter.value}`}>
            <button
              type="button"
              onClick={() => onClearFilter(filter.type, filter.value)}
              aria-label={t("filters.removeFilter", { type: prefix, value: filter.label })}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary-soft px-3 text-caption font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {prefix && <span className="opacity-75">{prefix}:</span>}
              <span>{filter.label}</span>
              <X aria-hidden className="size-3.5" />
            </button>
          </li>
        );
      })}
      {filters.length > 1 && (
        <li>
          <button
            type="button"
            onClick={() => onClearFilter("all")}
            className="inline-flex h-9 items-center px-2 text-caption font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("filters.clearAll")}
          </button>
        </li>
      )}
    </ul>
  );
};

export default ActiveFilters;
