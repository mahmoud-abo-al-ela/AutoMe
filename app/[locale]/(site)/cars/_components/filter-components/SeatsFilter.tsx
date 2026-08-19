"use client";

import { Users } from "lucide-react";
import { FilterSection } from "./FilterSection";
import { FilterChip } from "./FilterChip";
import type { SingleFacetProps } from "../../_lib/cars-types";

const SEAT_OPTIONS = [2, 4, 5, 7];

/**
 * Minimum-seats facet. Single-select: picks the "N+ seats" floor, which maps to
 * a `seats >= N` filter. Options are static (Car.seats is a small integer range).
 */
const SeatsFilter = ({
  selected,
  onSelect,
  isLoading,
}: Omit<SingleFacetProps, "options">) => {
  return (
    <FilterSection value="seats" icon={Users} label="Seats" count={selected ? 1 : 0}>
      <div className="flex flex-wrap gap-1.5 pt-1 pb-2">
        {SEAT_OPTIONS.map((n) => {
          const isSelected = selected === n;
          return (
            <FilterChip
              key={n}
              label={`${n}+ seats`}
              selected={isSelected}
              disabled={isLoading}
              onClick={() => onSelect(isSelected ? undefined : String(n))}
            />
          );
        })}
      </div>
    </FilterSection>
  );
};

export default SeatsFilter;
