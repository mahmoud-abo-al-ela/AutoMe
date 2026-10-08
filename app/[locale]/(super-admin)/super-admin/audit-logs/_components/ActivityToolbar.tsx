"use client";

import { useState, type TransitionStartFunction } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import SearchableLocationSelect from "@/components/SearchableLocationSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  PLATFORM_ACTIVITY_KINDS,
  PLATFORM_ACTIVITY_PERIODS,
  PLATFORM_ACTIVITY_WHO,
  platformActivityQueryString,
  type PlatformActivityQuery,
} from "@/lib/services/super-admin/platform-activity-options";

const BASE = "/super-admin/audit-logs";
const ANY = "any";
const trigger = "h-11 data-[size=default]:h-11 rounded-control border-[#8c8170] bg-field";
const half = "w-[calc(50%-0.3125rem)]";

/**
 * Search, who made the change, its kind, the dealership and the period, for
 * the Activity table. Each change goes to the URL and back to page one.
 */
export function ActivityToolbar({
  query,
  dealerships,
  startTransition,
}: {
  query: PlatformActivityQuery;
  dealerships: { id: string; name: string }[];
  startTransition: TransitionStartFunction;
}) {
  const t = useTranslations("superAdmin.auditLogs");
  const router = useRouter();
  const [search, setSearch] = useState(query.search);
  const go = (change: Partial<PlatformActivityQuery>) =>
    startTransition(() => router.replace(`${BASE}${platformActivityQueryString({ ...query, ...change, page: 1 })}`, { scroll: false }));
  const filtered = Boolean(query.search || query.who !== "all" || query.kind !== "all" || query.dealership || query.days !== "all");

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          go({ search: search.trim() });
        }}
        className="flex h-11 min-w-0 flex-[1_1_100%] items-center gap-2 rounded-control border border-[#8c8170] bg-field px-3 focus-within:ring-2 focus-within:ring-ring xl:max-w-[380px] xl:flex-[1_1_260px]"
      >
        <Search aria-hidden className="size-[18px] shrink-0 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        {search && (
          <button
            type="button"
            aria-label={t("filters.clear")}
            onClick={() => {
              setSearch("");
              if (query.search) go({ search: "" });
            }}
            className="-me-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X aria-hidden className="size-4" />
          </button>
        )}
      </form>

      <Select value={query.who} onValueChange={(value) => go({ who: value as PlatformActivityQuery["who"] })}>
        <SelectTrigger aria-label={t("filters.who")} className={cn(trigger, half, "sm:w-[210px]")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-control">
          {PLATFORM_ACTIVITY_WHO.map((who) => (
            <SelectItem key={who} value={who}>
              {t(`who.${who}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={query.kind} onValueChange={(value) => go({ kind: value as PlatformActivityQuery["kind"] })}>
        <SelectTrigger aria-label={t("filters.kind")} className={cn(trigger, half, "sm:w-[190px]")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-control">
          {PLATFORM_ACTIVITY_KINDS.map((kind) => (
            <SelectItem key={kind} value={kind}>
              {t(`kinds.${kind}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className={cn(half, "sm:w-[210px]")}>
        <SearchableLocationSelect
          value={query.dealership ?? ANY}
          options={[{ value: ANY, label: t("filters.anyDealership") }, ...dealerships.map((d) => ({ value: d.id, label: d.name }))]}
          placeholder={t("filters.anyDealership")}
          searchPlaceholder={t("filters.searchDealerships")}
          emptyMessage={t("filters.noDealerships")}
          onValueChange={(value) => go({ dealership: value === ANY ? null : value })}
          triggerClassName={cn(trigger, "w-full")}
        />
      </div>

      <Select value={query.days} onValueChange={(value) => go({ days: value as PlatformActivityQuery["days"] })}>
        <SelectTrigger aria-label={t("filters.period")} className={cn(trigger, half, "sm:w-[170px]")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-control">
          {PLATFORM_ACTIVITY_PERIODS.map((period) => (
            <SelectItem key={period} value={period}>
              {t(`periods.${period}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filtered && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            go({ search: "", who: "all", kind: "all", dealership: null, days: "all" });
          }}
          className="h-11 rounded-control px-3 text-caption font-semibold text-[#1d4e9e] underline-offset-2 hover:underline"
        >
          {t("filters.clear")}
        </button>
      )}
    </div>
  );
}
