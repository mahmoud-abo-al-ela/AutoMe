"use client";

import { Badge } from "@/components/ui/badge";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * Unified shell for every sidebar filter section. Owns the accordion item,
 * the icon + label header, the active-count badge, and the empty state — so
 * all seven sections share one padding scale, one badge treatment, and one
 * empty behaviour (the section always stays mounted; it never disappears and
 * shifts the sections below it).
 */
export const FilterSection = ({
  value,
  icon: Icon,
  label,
  count = 0,
  isEmpty = false,
  emptyLabel = "None available",
  children,
}) => {
  return (
    <AccordionItem value={value} className="border-none">
      <AccordionTrigger className="py-2 hover:no-underline cursor-pointer">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
          {label}
        </span>
        {count > 0 && (
          <Badge
            variant="secondary"
            className="ml-2 bg-primary/10 text-primary text-xs"
          >
            {count}
          </Badge>
        )}
      </AccordionTrigger>
      <AccordionContent>
        {isEmpty ? (
          <p className="py-1 text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          children
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

export default FilterSection;
