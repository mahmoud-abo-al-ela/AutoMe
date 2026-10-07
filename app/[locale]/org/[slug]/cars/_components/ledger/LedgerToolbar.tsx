"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Download, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportInventory } from "@/actions/inventory";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import { useFormatters } from "@/hooks/use-formatters";
import type { InventoryData, InventoryFilters } from "@/hooks/use-inventory";
import { BODY_TYPES } from "@/lib/constants/car-options";
import { cn } from "@/lib/utils";
import { useCarName, useLedgerText } from "./ledger-shared";

const ANY = "any";
const thisYear = new Date().getFullYear();
const YEARS = Array.from({ length: thisYear - 2004 }, (_, i) => thisYear - i);

/**
 * Above the table (page pattern 1, list): search with a visible label and a
 * "/" shortcut, one Filters control, and Export. Filters in use show as chips
 * underneath, each removable, with Clear all.
 */
export function LedgerToolbar({ state }: { state: InventoryData }) {
  const t = useTranslations("org.cars.ledger");
  const input = useRef<HTMLInputElement>(null);

  // "/" jumps to search from anywhere on the page that is not already a field.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
      event.preventDefault();
      input.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-[1_1_100%] flex-col gap-1.5 sm:flex-[1_1_20rem] sm:max-w-md">
          <label htmlFor="cars-search" className="text-caption font-semibold">
            {t("searchLabel")}
          </label>
          <div className="flex h-11 items-center gap-2 rounded-control border border-[#8c8170] bg-field px-3 focus-within:ring-[3px] focus-within:ring-ring/50">
            <Search aria-hidden className="size-[18px] text-muted-foreground" />
            <input
              ref={input}
              id="cars-search"
              type="search"
              value={state.search}
              onChange={(event) => state.handlers.setSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-keyshortcuts="/"
              autoComplete="off"
              className="h-full min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            />
            {state.search ? (
              <button
                type="button"
                onClick={() => {
                  state.handlers.setSearch("");
                  input.current?.focus();
                }}
                aria-label={t("clearSearch")}
                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X aria-hidden className="size-4" />
              </button>
            ) : (
              <kbd title={t("searchShortcut")} className="hidden rounded border border-border px-1.5 text-micro text-muted-foreground sm:inline">
                /
              </kbd>
            )}
          </div>
        </div>

        <FiltersPopover filters={state.filters} onChange={state.handlers.setFilters} />
        <span aria-hidden className="hidden flex-1 sm:block" />
        <ExportButton state={state} />
      </div>

      <FilterChips filters={state.filters} onChange={state.handlers.setFilters} />
    </div>
  );
}

function FiltersPopover({ filters, onChange }: { filters: InventoryFilters; onChange: (next: InventoryFilters) => void }) {
  const t = useTranslations("org.cars.ledger.filters");
  const attr = useCarAttributes();
  const fmt = useFormatters();
  const inUse = [filters.bodyType, filters.minYear, filters.featured].filter(Boolean).length;
  const year = (value: number) => fmt.number(value, { useGrouping: false });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline-strong" className="h-11 rounded-control border border-[#8c8170] bg-field px-4">
          <SlidersHorizontal aria-hidden className="size-[18px]" />
          {t("button")}
          {inUse > 0 && <span className="tabular-nums text-muted-foreground">{fmt.number(inUse)}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-72 flex-col gap-4 rounded-control p-4">
        <p className="text-body font-semibold">{t("title")}</p>

        <div className="flex flex-col gap-1.5">
          <label id="filter-body" className="text-caption font-semibold">
            {t("bodyType")}
          </label>
          <Select
            value={filters.bodyType ?? ANY}
            onValueChange={(value) => onChange({ ...filters, bodyType: value === ANY ? undefined : value })}
          >
            <SelectTrigger aria-labelledby="filter-body" className="h-11 w-full rounded-control border-[#8c8170] bg-field">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-control">
              <SelectItem value={ANY}>{t("anyBodyType")}</SelectItem>
              {BODY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {attr.body(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label id="filter-year" className="text-caption font-semibold">
            {t("minYear")}
          </label>
          <Select
            value={filters.minYear ? String(filters.minYear) : ANY}
            onValueChange={(value) => onChange({ ...filters, minYear: value === ANY ? undefined : Number(value) })}
          >
            <SelectTrigger aria-labelledby="filter-year" className="h-11 w-full rounded-control border-[#8c8170] bg-field">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72 rounded-control">
              <SelectItem value={ANY}>{t("anyYear")}</SelectItem>
              {YEARS.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {t("yearFrom", { year: year(value) })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-body">
          <Checkbox
            checked={!!filters.featured}
            onCheckedChange={(checked) => onChange({ ...filters, featured: checked === true || undefined })}
            className="size-5"
          />
          {t("featured")}
        </label>
      </PopoverContent>
    </Popover>
  );
}

function FilterChips({ filters, onChange }: { filters: InventoryFilters; onChange: (next: InventoryFilters) => void }) {
  const t = useTranslations("org.cars.ledger.chips");
  const attr = useCarAttributes();
  const fmt = useFormatters();

  const chips: { key: keyof InventoryFilters; label: string }[] = [];
  if (filters.bodyType) chips.push({ key: "bodyType", label: t("bodyType", { value: attr.body(filters.bodyType) }) });
  if (filters.minYear) chips.push({ key: "minYear", label: t("minYear", { year: fmt.number(filters.minYear, { useGrouping: false }) }) });
  if (filters.featured) chips.push({ key: "featured", label: t("featured") });

  if (chips.length === 0) return null;

  return (
    <ul aria-label={t("label")} className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <li key={chip.key} className="flex h-9 items-center gap-1 rounded-full bg-[#e7eef8] pe-1 ps-3 text-caption">
          {chip.label}
          <button
            type="button"
            onClick={() => onChange({ ...filters, [chip.key]: undefined })}
            aria-label={t("remove", { label: chip.label })}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full hover:bg-white/70"
          >
            <X aria-hidden className="size-4" />
          </button>
        </li>
      ))}
      <li>
        <button type="button" onClick={() => onChange({})} className="h-9 cursor-pointer px-2 text-caption font-semibold text-[#1d4e9e] hover:underline">
          {t("clearAll")}
        </button>
      </li>
    </ul>
  );
}

/**
 * Every car the table is showing — this view, search and filters, all pages —
 * as a CSV in the reader's language, with plain digits so a spreadsheet can
 * sum them. A BOM so Excel reads the Arabic as UTF-8.
 */
function ExportButton({ state }: { state: InventoryData }) {
  const t = useTranslations("org.cars.ledger");
  const locale = useLocale();
  const carName = useCarName();
  const text = useLedgerText();
  const [busy, setBusy] = useState(false);

  const exportCsv = async () => {
    setBusy(true);
    try {
      const response = await exportInventory({ ...state.input, page: 1 });
      if (!response.success) throw response.error;
      const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
      const header = [
        t("table.car"),
        t("table.price"),
        t("table.market"),
        t("table.saves"),
        t("table.drives"),
        t("table.listed"),
        t("table.status"),
        t("table.featured"),
      ];
      const lines = [
        header.map(cell).join(","),
        ...response.data.map((car) =>
          [
            carName(car),
            car.price,
            text.market(car.marketPercent).text,
            car.saves,
            car.testDrives,
            car.daysListed,
            t(`status.${car.status}`),
            car.featured ? t("csvYes") : t("csvNo"),
          ]
            .map(cell)
            .join(","),
        ),
      ];
      const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `autome-cars-${state.view}-${locale}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("exportFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="outline-strong"
      onClick={exportCsv}
      disabled={busy}
      className={cn("h-11 rounded-control border border-[#8c8170] bg-field px-4", busy && "cursor-wait")}
    >
      {busy ? <Loader2 aria-hidden className="size-[18px] animate-spin" /> : <Download aria-hidden className="size-[18px]" />}
      {busy ? t("exporting") : t("export")}
    </Button>
  );
}
