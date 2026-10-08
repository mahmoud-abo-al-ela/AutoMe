"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FilterCheckboxProps } from "./FilterCheckboxGroup";
import { FILTER_CHIP, FILTER_CHIP_ACTIVE } from "./filter-utils";

// contentWidthClass must be a static Tailwind class (e.g. "w-[200px]") so JIT
// can see it — pass it in from the parent rather than composing it dynamically.
export default function FilterCheckboxPopover({
  label,
  field,
  options = [],
  selectedCsv,
  onToggle,
  idPrefix,
  contentWidthClass = "w-[200px]",
}: FilterCheckboxProps & {
  idPrefix: string;
  contentWidthClass?: string;
}) {
  const selected = (selectedCsv || "").split(",").filter(Boolean);
  const active = selected.length > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`${FILTER_CHIP} ${active ? FILTER_CHIP_ACTIVE : ""}`}
        >
          <span>{label}</span>
          {active && (
            <Badge variant="secondary" className="h-5 px-1.5 bg-inverse-foreground text-inverse hover:bg-inverse-foreground font-bold text-micro rounded-full">
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-60 ms-0.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={`${contentWidthClass} p-3 rounded-control border border-border bg-card space-y-2`}
      >
        {options.map((opt) => {
          const isChecked = selected.includes(opt);
          return (
            <div key={opt} className="flex items-center gap-2.5 px-1 py-1">
              <Checkbox
                id={`${idPrefix}-${opt}`}
                checked={isChecked}
                onCheckedChange={() => onToggle(field, opt)}
              />
              <label
                htmlFor={`${idPrefix}-${opt}`}
                className="text-xs font-semibold text-muted-foreground cursor-pointer select-none truncate"
              >
                {opt}
              </label>
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
