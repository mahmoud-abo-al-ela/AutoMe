"use client";

import { Checkbox } from "@/components/ui/checkbox";

export interface FilterCheckboxProps {
  label: string;
  field: string;
  options?: string[];
  /** The selected values, stored in state as a comma-separated string. */
  selectedCsv?: string;
  onToggle: (field: string, value: string) => void;
}

// Mobile-sheet checkbox grid for one filter field (body/fuel/transmission).
export default function FilterCheckboxGroup({
  label,
  field,
  options,
  selectedCsv,
  onToggle,
}: FilterCheckboxProps) {
  if (!options || options.length === 0) return null;
  const selected = (selectedCsv || "").split(",").filter(Boolean);

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</h4>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const isChecked = selected.includes(opt);
          return (
            <label
              key={opt}
              className={`flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 cursor-pointer transition-colors ${isChecked ? "bg-primary/5 border-primary/20 text-primary" : "bg-white hover:bg-slate-50 text-slate-700"}`}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => onToggle(field, opt)}
              />
              <span className="text-xs font-semibold truncate">{opt}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
