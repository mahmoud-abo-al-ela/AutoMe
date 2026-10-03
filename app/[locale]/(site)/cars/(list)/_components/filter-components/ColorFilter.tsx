"use client";

import { Palette } from "lucide-react";
import { FilterSection } from "./FilterSection";
import type { FacetOption, SingleFacetProps } from "../../_lib/cars-types";
import { getCarColorHex } from "@/lib/constants/car-options";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import { useFormatters } from "@/hooks/use-formatters";

/**
 * Single-select colour facet with swatches. Options are real DB colours with
 * counts ([{ value, count }]); the swatch hex comes from getCarColorHex.
 */
const ColorFilter = ({
  selected,
  options = [],
  onSelect,
  isLoading,
}: SingleFacetProps<FacetOption>) => {
  const t = useTranslations("cars.filters");
  const attr = useCarAttributes();
  const fmt = useFormatters();
  return (
    <FilterSection
      value="color"
      icon={Palette}
      label={t("color")}
      count={selected ? 1 : 0}
      isEmpty={options.length === 0}
      emptyLabel={t("colorEmpty")}
    >
      <div className="flex flex-wrap gap-1.5 pt-1 pb-2">
        {options.map(({ value, count }) => {
          const isSelected = selected === value;
          return (
            <button
              key={value}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              aria-label={attr.color(value)}
              disabled={isLoading || count === 0}
              onClick={() => onSelect(isSelected ? undefined : value)}
              className={cn(
                // Same shape and states as FilterChip; the swatch is the only addition.
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-caption font-medium transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                isSelected
                  ? "border-inverse bg-inverse text-inverse-foreground hover:bg-inverse-hover"
                  : "border-border bg-field text-foreground hover:border-border-strong",
                (isLoading || count === 0) && "cursor-not-allowed opacity-40"
              )}
            >
              <span
                aria-hidden
                className="size-3.5 rounded-full border border-black/15"
                style={{ backgroundColor: getCarColorHex(value) }}
              />
              <span>{attr.color(value)}</span>
              {typeof count === "number" && (
                <span className={cn("text-micro tabular-nums", isSelected ? "text-inverse-foreground/70" : "text-muted-foreground")}>
                  {fmt.number(count)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </FilterSection>
  );
};

export default ColorFilter;
