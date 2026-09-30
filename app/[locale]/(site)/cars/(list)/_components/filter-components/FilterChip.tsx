"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormatters } from "@/hooks/use-formatters";

/**
 * Accessible, tenant-themable filter chip. Renders a real <button> with
 * aria-pressed so it is keyboard reachable and announced. Selected state uses
 * the design token (--primary) rather than a hard-coded colour, so it follows
 * per-tenant branding. Optionally shows a facet count and an X when selected.
 */
export const FilterChip = ({
  label,
  count,
  selected = false,
  disabled = false,
  onClick,
  className,
}: {
  label: string;
  count?: number;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) => {
  const fmt = useFormatters();
  const isDisabled = disabled || count === 0;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={label}
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        "transition-all duration-200 hover:scale-105 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        selected
          ? "border-primary bg-primary/10 text-primary hover:bg-primary/15"
          : "border-border bg-background text-foreground hover:bg-muted",
        isDisabled && "cursor-not-allowed opacity-40 hover:scale-100",
        className
      )}
    >
      <span>{label}</span>
      {typeof count === "number" && (
        <span className={cn("tabular-nums", selected ? "text-primary/70" : "text-muted-foreground")}>
          ({fmt.number(count)})
        </span>
      )}
      {selected && <X className="h-3 w-3" />}
    </button>
  );
};

export default FilterChip;
