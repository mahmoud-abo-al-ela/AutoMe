"use client";

import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { FilterSection } from "./FilterSection";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Generic min/max range section used for price, year and mileage. The slider
 * domain is pinned to `bounds` (global, unfiltered) so it doesn't shift as
 * other filters are applied. Drag updates local state; release commits.
 */
export interface RangeBounds {
  min: number;
  max: number;
}

export const RangeFilter = ({
  value,
  bounds,
  sectionValue,
  icon,
  label,
  step = 1,
  formatValue = (v) => String(v),
  onCommit,
  isLoading,
}: {
  /** The committed [min, max]; either end may be unset. */
  value?: [number | undefined, number | undefined];
  bounds?: RangeBounds | null;
  sectionValue: string;
  icon?: LucideIcon;
  label: string;
  step?: number;
  formatValue?: (value: number) => string;
  onCommit: (value: [number, number], bounds: RangeBounds) => void;
  isLoading?: boolean;
}) => {
  const t = useTranslations("cars.filters");
  const min = bounds?.min ?? 0;
  const max = bounds?.max ?? 100;
  const selectedMin = value?.[0] ?? min;
  const selectedMax = value?.[1] ?? max;

  const [local, setLocal] = useState([selectedMin, selectedMax]);

  // Keep in sync when external filters change the committed value.
  useEffect(() => {
    setLocal([selectedMin, selectedMax]);
  }, [selectedMin, selectedMax]);

  const isNarrowed = selectedMin > min || selectedMax < max;
  const ready = max > min;

  return (
    <FilterSection
      value={sectionValue}
      icon={icon}
      label={label}
      count={isNarrowed ? 1 : 0}
      isEmpty={false}
    >
      <div className="pt-2 pb-3">
        <div className="mb-4 flex items-center justify-between">
          <div className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-foreground">
            {formatValue(local[0])}
          </div>
          <div className="mx-2 h-px w-4 bg-border" />
          <div className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-foreground">
            {formatValue(local[1])}
          </div>
        </div>
        <Slider
          value={local}
          min={min}
          max={ready ? max : min + 1}
          step={step}
          onValueChange={(v) => !isLoading && setLocal(v)}
          // A two-thumb slider always emits both ends.
          onValueCommit={(v) =>
            !isLoading && ready && onCommit(v as [number, number], { min, max })
          }
          disabled={isLoading || !ready}
          className="mb-2"
        />
        {!ready && (
          <p className="text-center text-xs text-muted-foreground">{t("loadingRange")}</p>
        )}
      </div>
    </FilterSection>
  );
};

export default RangeFilter;
