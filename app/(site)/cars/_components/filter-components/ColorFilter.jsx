"use client";

import { Palette } from "lucide-react";
import { FilterSection } from "./FilterSection";
import { getCarColorHex } from "@/lib/constants/car-options";
import { cn } from "@/lib/utils";

/**
 * Single-select colour facet with swatches. Options are real DB colours with
 * counts ([{ value, count }]); the swatch hex comes from getCarColorHex.
 */
const ColorFilter = ({ selected, options = [], onSelect, isLoading }) => {
  return (
    <FilterSection
      value="color"
      icon={Palette}
      label="Color"
      count={selected ? 1 : 0}
      isEmpty={options.length === 0}
      emptyLabel="No colors available"
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
              aria-label={value}
              disabled={isLoading || count === 0}
              onClick={() => onSelect(isSelected ? undefined : value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground hover:bg-muted",
                (isLoading || count === 0) && "cursor-not-allowed opacity-40 hover:scale-100"
              )}
            >
              <span
                className="h-3 w-3 rounded-full border border-black/10"
                style={{ backgroundColor: getCarColorHex(value) }}
              />
              <span>{value}</span>
              {typeof count === "number" && (
                <span className={cn("tabular-nums", isSelected ? "text-primary/70" : "text-muted-foreground")}>
                  ({count})
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
