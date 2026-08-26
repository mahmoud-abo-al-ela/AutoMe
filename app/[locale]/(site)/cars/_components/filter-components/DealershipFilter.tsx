"use client";

import { Building2 } from "lucide-react";
import { FilterSection } from "./FilterSection";
import type {
  DealershipFacetOption,
  SingleFacetProps,
} from "../../_lib/cars-types";
import { FilterChip } from "./FilterChip";
import { useTranslations } from "next-intl";

const DealershipFilter = ({
  selected,
  options = [],
  onSelect,
  isLoading,
}: SingleFacetProps<DealershipFacetOption>) => {
  const t = useTranslations("cars.filters");
  return (
    <FilterSection
      value="dealership"
      icon={Building2}
      label={t("dealership")}
      count={selected ? 1 : 0}
      isEmpty={options.length === 0}
      emptyLabel={t("dealershipEmpty")}
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
