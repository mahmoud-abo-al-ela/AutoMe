"use client";

import { useState, type TransitionStartFunction } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { EGYPT_GOVERNORATES } from "@/lib/locations/data";
import {
  DEALERSHIP_PLANS,
  DEALERSHIP_SORTS,
  dealershipQueryString,
  type DealershipQuery,
} from "@/lib/services/super-admin/dealerships-options";

const BASE = "/super-admin/organizations";
const ALL = "all";
const trigger = "h-11 rounded-control border-[#8c8170] bg-field";

/**
 * Search, plan, governorate and sort for the dealerships list. Each change
 * goes to the URL — so a filtered list can be shared — and back to page one;
 * the view tabs above keep their own place. The list dims while it loads.
 */
export function DealershipsToolbar({ query, startTransition }: { query: DealershipQuery; startTransition: TransitionStartFunction }) {
  const t = useTranslations("superAdmin.organizations");
  const tPlans = useTranslations("plans");
  const locale = useLocale();
  const router = useRouter();
  const [search, setSearch] = useState(query.search);

  const go = (change: Partial<DealershipQuery>) =>
    startTransition(() => router.replace(`${BASE}${dealershipQueryString({ ...query, ...change, page: 1 })}`, { scroll: false }));

  const governorates = [...EGYPT_GOVERNORATES].sort((a, b) =>
    (locale === "ar" ? a.ar : a.en).localeCompare(locale === "ar" ? b.ar : b.en, locale),
  );
  const filtered = Boolean(query.search || query.plan || query.region);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          go({ search: search.trim() });
        }}
        className="flex h-11 min-w-0 flex-[1_1_280px] items-center gap-2 rounded-control border border-[#8c8170] bg-field px-3 focus-within:ring-2 focus-within:ring-ring sm:max-w-[440px]"
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

      <Select value={query.plan ?? ALL} onValueChange={(value) => go({ plan: value === ALL ? null : (value as DealershipQuery["plan"]) })}>
        <SelectTrigger aria-label={t("filters.plan")} className={`${trigger} w-[min(100%,170px)]`}>
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
        <SelectTrigger aria-label={t("filters.region")} className={`${trigger} w-[min(100%,200px)]`}>
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
            go({ search: "", plan: null, region: null });
          }}
          className="h-11 rounded-control px-3 text-caption font-semibold text-[#1d4e9e] underline-offset-2 hover:underline"
        >
          {t("filters.clear")}
        </button>
      )}

      <div className="flex items-center gap-2 sm:ms-auto">
        <label id="dealerships-sort" className="text-caption text-muted-foreground">
          {t("filters.sort")}
        </label>
        <Select value={query.sort} onValueChange={(value) => go({ sort: value as DealershipQuery["sort"] })}>
          <SelectTrigger aria-labelledby="dealerships-sort" className={`${trigger} w-[170px]`}>
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
