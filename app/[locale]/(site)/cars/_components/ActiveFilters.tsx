"use client";

import { useTranslations } from "next-intl";
import { X, FilterX } from "lucide-react";
import { motion } from "framer-motion";
import type { CarsActiveFilter, CarsHandlers } from "../_lib/cars-types";



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
  const typeLabel = (type: string) =>
    t.has(`activeFilters.${type}`) ? t(`activeFilters.${type}`) : "";

  if (!filters || filters.length === 0) return null;

  return (
    <div className="mb-6 flex min-h-[32px] flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <motion.button
          key={`${filter.type}-${filter.value}`}
          type="button"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          onClick={() => onClearFilter(filter.type, filter.value)}
          aria-label={t("filters.removeFilter", {
            type: typeLabel(filter.type),
            value: filter.label,
          })}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="text-muted-foreground">{typeLabel(filter.type)}:</span>
          <span>{filter.label}</span>
          <X className="h-3 w-3" />
        </motion.button>
      ))}

      {filters.length > 1 && (
        <button
          type="button"
          onClick={() => onClearFilter("all")}
          className="ms-1 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <FilterX className="h-3.5 w-3.5" />
          {t("filters.clearAll")}
        </button>
      )}
    </div>
  );
};

export default ActiveFilters;
