"use client";

import { Building2 } from "lucide-react";
import { FilterSection } from "./FilterSection";
import { FilterChip } from "./FilterChip";

const DealershipFilter = ({ selected, options = [], onSelect, isLoading }) => {
  return (
    <FilterSection
      value="dealership"
      icon={Building2}
      label="Dealership"
      count={selected ? 1 : 0}
      isEmpty={options.length === 0}
      emptyLabel="No dealerships available"
    >
      <div className="flex flex-wrap gap-1.5 pt-1 pb-2">
        {options.map((dealer) => {
          const isSelected = selected === dealer.slug;
          return (
            <FilterChip
              key={dealer.slug}
              label={dealer.name}
              selected={isSelected}
              disabled={isLoading}
              onClick={() => onSelect(isSelected ? undefined : dealer.slug)}
            />
          );
        })}
      </div>
    </FilterSection>
  );
};

export default DealershipFilter;
