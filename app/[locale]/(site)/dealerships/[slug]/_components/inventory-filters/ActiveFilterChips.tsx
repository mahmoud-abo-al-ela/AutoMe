"use client";

import { X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import type { ActiveFilterChip } from "../../_lib/detail-types";

// Animated row of active-filter chips with a "Clear All" action.
export default function ActiveFilterChips({
  chips,
  onRemove,
  onClearAll,
}: {
  chips: ActiveFilterChip[];
  onRemove: (field: string, value?: string) => void;
  onClearAll: () => void;
}) {
  return (
    <AnimatePresence>
      {chips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="flex flex-wrap items-center gap-1.5 pt-1"
        >
          {chips.map((chip, idx) => (
            <motion.div
              key={`${chip.field}-${chip.value || idx}`}
              layout
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Badge variant="outline" className="flex items-center gap-1 py-1 pl-2.5 pr-1.5 bg-slate-50 border-slate-200 text-slate-600 rounded-full font-medium text-[11px] select-none hover:bg-slate-100 transition-colors">
                <span>{chip.label}</span>
                <button
                  onClick={() => onRemove(chip.field, chip.value)}
                  className="h-4 w-4 bg-slate-200/60 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            </motion.div>
          ))}

          <Button
            variant="ghost"
            onClick={onClearAll}
            className="h-7 gap-1.5 px-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all font-semibold text-[11px] cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Clear All
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
