"use client";

import { useState, type TransitionStartFunction } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { Search, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import SearchableLocationSelect from "@/components/SearchableLocationSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { USER_SORTS, USER_VIEWS, userQueryString, type UserQuery } from "@/lib/services/super-admin/users-options";

const BASE = "/super-admin/users";
const ANY = "any";
const trigger = "h-11 data-[size=default]:h-11 rounded-control border-[#8c8170] bg-field";

/**
 * Search, the kind of account (with how many of each), the dealership a team
 * belongs to, and the sort, for the users list. Each change goes to the URL
 * and back to page one. The dealership list is searchable — there can be many.
 */
export function UsersToolbar({
  query,
  counts,
  dealerships,
  startTransition,
}: {
  query: UserQuery;
  counts: Record<(typeof USER_VIEWS)[number], number>;
  dealerships: { id: string; name: string }[];
  startTransition: TransitionStartFunction;
}) {
  const t = useTranslations("superAdmin.users");
  const router = useRouter();
  const fmt = useFormatters();
  const [search, setSearch] = useState(query.search);
  const go = (change: Partial<UserQuery>) =>
    startTransition(() => router.replace(`${BASE}${userQueryString({ ...query, ...change, page: 1 })}`, { scroll: false }));
  const filtered = Boolean(query.search || query.view !== "all" || query.dealership);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          go({ search: search.trim() });
        }}
        className="flex h-11 min-w-0 flex-[1_1_100%] items-center gap-2 rounded-control border border-[#8c8170] bg-field px-3 focus-within:ring-2 focus-within:ring-ring sm:flex-[1_1_280px] sm:max-w-[440px]"
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

      <Select value={query.view} onValueChange={(value) => go({ view: value as UserQuery["view"] })}>
        <SelectTrigger aria-label={t("views.label")} className={cn(trigger, "w-full sm:w-[220px]")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-control">
          {USER_VIEWS.map((view) => (
            <SelectItem key={view} value={view}>
              <span className="flex w-full items-center justify-between gap-3">
                {t(`views.${view}`)}
                <span className="rounded-full bg-muted px-2 text-micro font-semibold leading-5 tabular-nums">{fmt.number(counts[view])}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="w-[calc(50%-0.3125rem)] sm:w-[220px]">
        <SearchableLocationSelect
          value={query.dealership ?? ANY}
          options={[{ value: ANY, label: t("filters.anyDealership") }, ...dealerships.map((d) => ({ value: d.id, label: d.name }))]}
          placeholder={t("filters.anyDealership")}
          searchPlaceholder={t("filters.dealership")}
          emptyMessage={t("empty")}
          onValueChange={(value) => go({ dealership: value === ANY ? null : value })}
          triggerClassName={cn(trigger, "w-full")}
        />
      </div>

      {filtered && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            go({ search: "", view: "all", dealership: null });
          }}
          className="order-last h-11 rounded-control px-3 text-caption font-semibold text-[#1d4e9e] sm:order-none underline-offset-2 hover:underline"
        >
          {t("filters.clear")}
        </button>
      )}

      {/* On a phone the sort sits beside the dealership, without its label. */}
      <div className="flex w-[calc(50%-0.3125rem)] items-center gap-2 sm:ms-auto sm:w-auto">
        <label id="users-sort" className="hidden shrink-0 text-caption text-muted-foreground sm:inline">
          {t("filters.sort")}
        </label>
        <Select value={query.sort} onValueChange={(value) => go({ sort: value as UserQuery["sort"] })}>
          <SelectTrigger aria-labelledby="users-sort" className={cn(trigger, "w-full sm:w-[170px]")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-control">
            {USER_SORTS.map((sort) => (
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
