"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_LABELS } from "@/lib/constants/car-options";

const SORT_ORDER = ["newest", "priceAsc", "priceDesc", "yearDesc", "yearAsc", "mileageAsc"];
const PER_PAGE_OPTIONS = [12, 24, 48];

export const ResultsSummary = ({
  currentPage,
  limit,
  total,
  sortBy,
  onSortChange,
  perPage,
  onPerPageChange,
  isLoading,
}) => {
  const start = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);

  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:gap-0">
      <p className="flex items-center text-sm text-muted-foreground" role="status" aria-live="polite">
        <span>Showing</span>
        <span className="mx-1.5 rounded border border-border bg-background px-1.5 py-0.5 font-bold text-foreground shadow-sm">
          {start}-{end}
        </span>
        <span>of</span>
        <span className="mx-1.5 font-bold text-primary">{total.toLocaleString()}</span>
        <span>vehicles</span>
      </p>

      <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
        {perPage && onPerPageChange && (
          <Select value={String(perPage)} onValueChange={(v) => onPerPageChange(Number(v))} disabled={isLoading}>
            <SelectTrigger className="hidden h-9 w-[110px] cursor-pointer text-sm sm:flex" aria-label="Results per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PER_PAGE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)} className="cursor-pointer">
                  {n} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={sortBy} onValueChange={(v) => !isLoading && onSortChange(v)} disabled={isLoading}>
          <SelectTrigger className="h-9 w-full cursor-pointer text-sm sm:w-[190px]" aria-label="Sort results">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_ORDER.map((value) => (
              <SelectItem key={value} value={value} className="cursor-pointer">
                {SORT_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ResultsSummary;
