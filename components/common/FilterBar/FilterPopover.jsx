"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * A filter dropdown trigger + popover. The trigger shows the filter label and,
 * when active, a count/label badge and a primary-tinted state. Radix supplies
 * aria-expanded/haspopup; we add an aria-label so the active count is announced.
 */
export const FilterPopover = ({
  label,
  activeCount = 0,
  activeLabel,
  children,
  align = "start",
  contentClassName,
}) => {
  const active = activeCount > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label={active ? `${label}, ${activeCount} selected` : label}
          className={cn(
            "h-9 gap-1.5 px-3 text-xs font-medium",
            active && "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
          )}
        >
          <span>{label}</span>
          {active && (
            <Badge
              variant="secondary"
              className="h-5 min-w-5 justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary"
            >
              {activeLabel || activeCount}
            </Badge>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className={cn("w-[260px] p-3", contentClassName)}>
        {children}
      </PopoverContent>
    </Popover>
  );
};

export default FilterPopover;
