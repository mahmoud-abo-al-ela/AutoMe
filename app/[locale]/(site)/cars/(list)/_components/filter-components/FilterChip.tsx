"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormatters } from "@/hooks/use-formatters";

/**
 * Accessible filter chip (Figma: Chip / Filter). A real <button> with
 * role="checkbox" so it is keyboard reachable and announced. Selected is the
 * asphalt pill with full-contrast text — the state reads at a glance and
 * never relies on a tint. The facet count rides along; a zero-count option
 * is disabled rather than hidden, so the list does not reflow.
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
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-caption font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        selected
          ? "border-inverse bg-inverse text-inverse-foreground hover:bg-inverse-hover"
          : "border-border bg-field text-foreground hover:border-border-strong",
        isDisabled && "cursor-not-allowed opacity-40",
        className
      )}
    >
      <span>{label}</span>
      {typeof count === "number" && (
        <span className={cn("text-micro tabular-nums", selected ? "text-inverse-foreground/70" : "text-muted-foreground")}>
          {fmt.number(count)}
        </span>
      )}
      {selected && <X aria-hidden className="size-3.5" />}
    </button>
  );
};

export default FilterChip;
