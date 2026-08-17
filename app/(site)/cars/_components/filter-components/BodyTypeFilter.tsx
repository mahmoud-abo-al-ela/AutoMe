"use client";

import { CarFront } from "lucide-react";
import { FilterSection } from "./FilterSection";
import { FilterChip } from "./FilterChip";
import type { MultiFacetProps } from "../../_lib/cars-types";

const BodyTypeFilter = ({
  selected = [],
  options = [],
  onToggle,
  isLoading,
}: MultiFacetProps) => {
  return (
    <FilterSection
      value="body"
      icon={CarFront}
      label="Body Type"
      count={selected.length}
      isEmpty={options.length === 0}
      emptyLabel="No body types available"
    >
      <div className="flex flex-wrap gap-1.5 pt-1 pb-2">
        {options.map(({ value, count }) => (
          <FilterChip
            key={value}
            label={value}
            count={count}
            selected={selected.includes(value)}
            disabled={isLoading}
            onClick={() => onToggle(value)}
          />
        ))}
      </div>
    </FilterSection>
  );
};

export default BodyTypeFilter;
