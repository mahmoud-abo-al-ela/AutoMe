"use client";

import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useFormatters } from "@/hooks/use-formatters";

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
}: {
  value: string;
  icon?: LucideIcon;
  label: string;
  count?: number;
  isEmpty?: boolean;
  emptyLabel?: string;
  children: React.ReactNode;
}) => {
  const fmt = useFormatters();
  return (
    <AccordionItem value={value} className="border-b border-border last:border-b-0">
      <AccordionTrigger className="min-h-12 cursor-pointer py-3 hover:no-underline">
        <span className="flex items-center gap-2 text-caption font-semibold">
          {Icon && <Icon aria-hidden className="size-4 text-muted-foreground" />}
          {label}
        </span>
        {count > 0 && (
          <Badge
            variant="secondary"
            className="ms-auto me-2 rounded-full bg-inverse px-2 text-micro text-inverse-foreground"
          >
            {fmt.number(count)}
          </Badge>
        )}
      </AccordionTrigger>
      <AccordionContent>
        {isEmpty ? (
          <p className="py-1 text-caption text-muted-foreground">{emptyLabel}</p>
        ) : (
          children
        )}
      </AccordionContent>
    </AccordionItem>
  );
};

export default FilterSection;
