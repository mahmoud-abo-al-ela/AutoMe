"use client";

import { LayoutGrid, List } from "lucide-react";
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";

const SORT_ORDER = ["newest", "priceAsc", "priceDesc", "yearDesc", "yearAsc", "mileageAsc"];

export type ResultsView = "grid" | "list";

/**
 * Results toolbar (Figma: Browse — toolbar): how many cars, how they are
 * sorted, and — from lg — grid or list. The count is a live region, so a
 * screen reader hears the new total after each filter change.
 *
 * The per-page selector is gone from the page (it was noise next to sort);
 * `perPage` still works as a URL parameter.
 */
export const ResultsSummary = ({
  total,
  sortBy,
  onSortChange,
  view,
  onViewChange,
  isLoading,
  leading,
}: {
  total: number;
  sortBy?: string;
  onSortChange: (value: string) => void;
  view: ResultsView;
  onViewChange: (view: ResultsView) => void;
  isLoading?: boolean;
  /** Phones: the Filters button sits at the start of the same row. */
  leading?: React.ReactNode;
}) => {
  const t = useTranslations("cars");
  const fmt = useFormatters();

  return (
    <div className="flex flex-wrap items-center gap-3">
      {leading}
      <p role="status" aria-live="polite" className="me-auto text-h3 font-semibold max-sm:text-body">
        {t("results.count", { count: total, value: fmt.number(total) })}
      </p>

      <Select value={sortBy} onValueChange={(v) => !isLoading && onSortChange(v)} disabled={isLoading}>
        <SelectTrigger
          // Phones: narrower so Filters, the count and sort share one sticky row.
          className="h-10 w-[8.75rem] cursor-pointer rounded-control border-border bg-field text-caption font-medium sm:w-auto sm:min-w-[10.5rem] [&>span]:truncate"
          aria-label={t("results.sortLabel")}
        >
          <SelectValue placeholder={t("results.sortPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {SORT_ORDER.map((value) => (
            <SelectItem key={value} value={value} className="min-h-10 cursor-pointer">
              {t(`sort.${value}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div role="group" aria-label={t("view.label")} className="hidden overflow-hidden rounded-control border border-border lg:flex">
        {(["grid", "list"] as const).map((option) => {
          const Icon = option === "grid" ? LayoutGrid : List;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              title={t(`view.${option}`)}
              aria-label={t(`view.${option}`)}
              onClick={() => onViewChange(option)}
              className={cn(
                "flex size-10 items-center justify-center transition-colors",
                view === option ? "bg-inverse text-inverse-foreground" : "bg-field hover:bg-muted"
              )}
            >
              <Icon aria-hidden className="size-[18px]" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ResultsSummary;
