"use client";

import { X, FilterX } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Removable active-filter chips + a "Clear all" affordance. Each chip is a real
 * <button> with an aria-label, so removals are keyboard reachable and announced.
 *
 * filters: [{ type, label }] — onClear(type) removes one; onClear("all") resets.
 */
export const ActiveFilterChips = ({ filters, onClear, className }) => {
  if (!filters || filters.length === 0) return null;

  return (
    <div className={cn("flex min-h-[32px] flex-wrap items-center gap-2", className)}>
      {filters.map((filter) => (
        <motion.button
          key={filter.type}
          type="button"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
          onClick={() => onClear(filter.type)}
          aria-label={`Remove filter ${filter.label}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span>{filter.label}</span>
          <X className="h-3 w-3" />
        </motion.button>
      ))}

      {filters.length > 1 && (
        <button
          type="button"
          onClick={() => onClear("all")}
          className="ml-1 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <FilterX className="h-3.5 w-3.5" />
          Clear all
        </button>
      )}
    </div>
  );
};

export default ActiveFilterChips;
