"use client";

import { useState, type TransitionStartFunction } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { Search, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { EGYPT_GOVERNORATES } from "@/lib/locations/data";
import {
  DEALERSHIP_PLANS,
  DEALERSHIP_SORTS,
  DEALERSHIP_VIEWS,
  dealershipQueryString,
  type DealershipQuery,
} from "@/lib/services/super-admin/dealerships-options";

const BASE = "/super-admin/organizations";
const ALL = "all";
// Two to a line on a phone.
const half = "w-[calc(50%-0.3125rem)]";
const trigger = "h-11 data-[size=default]:h-11 rounded-control border-[#8c8170] bg-field";

/**
 * Search, status (with how many dealerships are in each), plan, governorate
 * and sort for the dealerships list. Each change goes to the URL — so a
 * filtered list can be shared — and back to page one. The list dims while it
 * loads.
 */
export function DealershipsToolbar({
  query,
  counts,
  startTransition,
}: {
  query: DealershipQuery;
  counts: Record<(typeof DEALERSHIP_VIEWS)[number], number>;
  startTransition: TransitionStartFunction;
}) {
  const t = useTranslations("superAdmin.organizations");
  const tPlans = useTranslations("plans");
  const locale = useLocale();
  const router = useRouter();
  const fmt = useFormatters();
  const [search, setSearch] = useState(query.search);

  const go = (change: Partial<DealershipQuery>) =>
    startTransition(() => router.replace(`${BASE}${dealershipQueryString({ ...query, ...change, page: 1 })}`, { scroll: false }));

  const governorates = [...EGYPT_GOVERNORATES].sort((a, b) =>
    (locale === "ar" ? a.ar : a.en).localeCompare(locale === "ar" ? b.ar : b.en, locale),
  );
  const filtered = Boolean(query.search || query.view !== "all" || query.plan || query.region);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          go({ search: search.trim() });
        }}
        className="flex h-11 min-w-0 flex-[1_1_100%] items-center gap-2 rounded-control border border-[#8c8170] bg-field px-3 focus-within:ring-2 focus-within:ring-ring sm:max-w-[440px] sm:flex-[1_1_280px]"
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

      <Select value={query.view} onValueChange={(value) => go({ view: value as DealershipQuery["view"] })}>
        <SelectTrigger aria-label={t("views.label")} className={`${trigger} ${half} sm:w-[210px]`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-control">
          {DEALERSHIP_VIEWS.map((view) => (
            <SelectItem key={view} value={view}>
              <span className="flex w-full items-center justify-between gap-3">
                {t(`views.${view}`)}
                <span className="rounded-full bg-muted px-2 text-micro font-semibold leading-5 tabular-nums">{fmt.number(counts[view])}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={query.plan ?? ALL} onValueChange={(value) => go({ plan: value === ALL ? null : (value as DealershipQuery["plan"]) })}>
        <SelectTrigger aria-label={t("filters.plan")} className={`${trigger} ${half} sm:w-[170px]`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-control">
          <SelectItem value={ALL}>{t("filters.allPlans")}</SelectItem>
          {DEALERSHIP_PLANS.map((plan) => (
            <SelectItem key={plan} value={plan}>
              {tPlans(`plans.${planKeyFor(plan)}.name`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={query.region ?? ALL} onValueChange={(value) => go({ region: value === ALL ? null : value })}>
        <SelectTrigger aria-label={t("filters.region")} className={`${trigger} ${half} sm:w-[200px]`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-80 rounded-control">
          <SelectItem value={ALL}>{t("filters.allRegions")}</SelectItem>
          {governorates.map((governorate) => (
            <SelectItem key={governorate.code} value={governorate.code}>
              {locale === "ar" ? governorate.ar : governorate.en}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filtered && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            go({ search: "", view: "all", plan: null, region: null });
          }}
          className="order-last h-11 rounded-control px-3 text-caption sm:order-none font-semibold text-[#1d4e9e] underline-offset-2 hover:underline"
        >
          {t("filters.clear")}
        </button>
      )}

      {/* On a phone the sort sits beside the governorate, without its label. */}
      <div className={`flex items-center gap-2 ${half} sm:ms-auto sm:w-auto`}>
        <label id="dealerships-sort" className="hidden text-caption text-muted-foreground sm:inline">
          {t("filters.sort")}
        </label>
        <Select value={query.sort} onValueChange={(value) => go({ sort: value as DealershipQuery["sort"] })}>
          <SelectTrigger aria-labelledby="dealerships-sort" className={`${trigger} w-full sm:w-[170px]`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-control">
            {DEALERSHIP_SORTS.map((sort) => (
              <SelectItem key={sort} value={sort}>
                {t(`sorts.${sort}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
