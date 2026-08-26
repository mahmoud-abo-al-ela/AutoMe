"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";

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
}: {
  currentPage: number;
  limit: number;
  total: number;
  sortBy?: string;
  onSortChange: (value: string) => void;
  perPage: number;
  onPerPageChange: (value: number) => void;
  isLoading?: boolean;
}) => {
  const t = useTranslations("cars");
  const fmt = useFormatters();
  const start = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);

  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:gap-0">
      {/*
        One message with rich-text tags rather than five sibling <span>s. The
        pieces used to be laid out in English order ("Showing" · range · "of" ·
        total · "vehicles"); Arabic does not put them in that order, and no
        amount of RTL flipping fixes word order. Handing the whole sentence to
        the translator lets each locale place the emphasised parts itself.
      */}
      <p className="flex items-center text-sm text-muted-foreground" role="status" aria-live="polite">
        {t.rich("results.summary", {
          start: fmt.number(start),
          end: fmt.number(end),
          total: fmt.number(total),
          count: total,
          range: (chunks) => (
            <span className="mx-1.5 rounded border border-border bg-background px-1.5 py-0.5 font-bold text-foreground shadow-sm">
              {chunks}
            </span>
          ),
          strong: (chunks) => (
            <span className="mx-1.5 font-bold text-primary">{chunks}</span>
          ),
        })}
      </p>

      <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
        {perPage && onPerPageChange && (
          <Select value={String(perPage)} onValueChange={(v) => onPerPageChange(Number(v))} disabled={isLoading}>
            <SelectTrigger className="hidden h-9 w-[110px] cursor-pointer text-sm sm:flex" aria-label={t("results.perPageLabel")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PER_PAGE_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)} className="cursor-pointer">
                  {t("results.perPage", { value: fmt.number(n) })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={sortBy} onValueChange={(v) => !isLoading && onSortChange(v)} disabled={isLoading}>
          <SelectTrigger className="h-9 w-full cursor-pointer text-sm sm:w-[190px]" aria-label={t("results.sortLabel")}>
            <SelectValue placeholder={t("results.sortPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {SORT_ORDER.map((value) => (
              <SelectItem key={value} value={value} className="cursor-pointer">
                {t(`sort.${value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ResultsSummary;
