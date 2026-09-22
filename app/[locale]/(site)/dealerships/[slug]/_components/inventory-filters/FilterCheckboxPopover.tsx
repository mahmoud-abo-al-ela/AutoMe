"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FilterCheckboxProps } from "./FilterCheckboxGroup";

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
          className={`h-9.5 gap-1.5 px-3 rounded-lg bg-white border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-all ${active ? "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10" : ""}`}
        >
          <span className="text-xs">{label}</span>
          {active && (
            <Badge variant="secondary" className="h-5 px-1.5 bg-primary/10 text-primary hover:bg-primary/15 font-bold text-micro rounded-full">
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-60 ms-0.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={`${contentWidthClass} p-3 rounded-xl border border-slate-100 shadow-xl bg-white space-y-2`}
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
                className="text-xs font-semibold text-slate-700 cursor-pointer select-none truncate"
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
