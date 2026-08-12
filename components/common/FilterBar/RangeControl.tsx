"use client";

import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";

/**
 * Generic min/max range control. The slider domain is pinned to `bounds`
 * (global, unfiltered) so it doesn't shift as other filters are applied. Drag
 * updates local state; release commits via onCommit([min, max], bounds).
 */
export type RangeBounds = {
  min?: number;
  max?: number;
};

type RangeControlProps = {
  value?: [number, number] | number[] | null;
  bounds?: RangeBounds | null;
  step?: number;
  formatValue?: (value: number) => React.ReactNode;
  onCommit: (range: number[], bounds: RangeBounds | null | undefined) => void;
  disabled?: boolean;
};

export const RangeControl = ({
  value,
  bounds,
  step = 1,
  formatValue = (v) => v,
  onCommit,
  disabled = false,
}: RangeControlProps) => {
  const min = bounds?.min ?? 0;
  const max = bounds?.max ?? 100;
  const selectedMin = value?.[0] ?? min;
  const selectedMax = value?.[1] ?? max;

  const [local, setLocal] = useState([selectedMin, selectedMax]);

  useEffect(() => {
    setLocal([selectedMin, selectedMax]);
  }, [selectedMin, selectedMax]);

  const ready = max > min;

  return (
    <div className="pt-1 pb-2">
      <div className="mb-3 flex items-center justify-between">
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
        onValueChange={(v) => !disabled && setLocal(v)}
        onValueCommit={(v) => !disabled && ready && onCommit(v, bounds)}
        disabled={disabled || !ready}
      />
      {!ready && (
        <p className="mt-2 text-center text-xs text-muted-foreground">No inventory data</p>
      )}
    </div>
  );
};

export default RangeControl;
