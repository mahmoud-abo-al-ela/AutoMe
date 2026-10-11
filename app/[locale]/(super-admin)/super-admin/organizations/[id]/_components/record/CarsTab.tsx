"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import {
  DETAIL_CARS_PER_PAGE,
  DETAIL_CAR_SORTS,
  DETAIL_CAR_STATUSES,
  dealershipDetailHref,
  type DealershipDetailQuery,
} from "@/lib/services/super-admin/dealerships-options";
import type { DealershipDetail } from "@/lib/services/super-admin/dealership-detail";
import { Pager } from "../../../../_components/Pager";
import { CarsTable } from "./CarsTable";
import { chip, chipOff, chipOn, panel, trigger } from "./record-styles";
import { useGo } from "./use-go";

/**
 * The Cars tab (canvas: dealership tabs round 1, "Cars A · Inventory table"):
 * status chips with their counts, search and sort above the table, ten cars to
 * a page. Everything is in the URL.
 */
export function CarsTab({
  data,
  base,
}: {
  data: Extract<DealershipDetail, { cars: unknown }>;
  base: string;
}) {
  const t = useTranslations("superAdmin.organizations.details.cars");
  const tStatus = useTranslations("org.cars.ledger.status");
  const fmt = useFormatters();
  const { go, pending } = useGo();
  const { query, counts } = data;
  const { rows, total, page, pages } = data.cars;
  const [search, setSearch] = useState(query.search);
  const href = (next: Partial<DealershipDetailQuery>) =>
    dealershipDetailHref(base, {
      tab: "cars",
      status: query.status,
      search: query.search,
      sort: query.sort,
      page: 1,
      ...next,
    });
  const statusCount = {
    all: counts.cars,
    AVAILABLE: counts.carsOnSale,
    UNAVAILABLE: counts.carsHidden,
    SOLD: counts.carsSold,
  };
  const from = total === 0 ? 0 : (page - 1) * DETAIL_CARS_PER_PAGE + 1;
  const to = Math.min(page * DETAIL_CARS_PER_PAGE, total);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <nav
          aria-label={t("statusLabel")}
          className="-mx-4 flex w-[calc(100%+2rem)] gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:w-auto sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {DETAIL_CAR_STATUSES.map((status) => (
            <Link
              key={status}
              href={href({ status })}
              scroll={false}
              aria-current={status === query.status ? "page" : undefined}
              className={cn(chip, status === query.status ? chipOn : chipOff)}
            >
              {status === "all" ? t("all") : tStatus(status)}
              <span className="tabular-nums opacity-80">
                {fmt.number(statusCount[status])}
              </span>
            </Link>
          ))}
        </nav>
        <span className="hidden flex-1 lg:block" />
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            go(href({ search: search.trim() }));
          }}
          className="flex h-10 min-w-0 flex-[1_1_100%] items-center gap-2 rounded-control border border-[#8c8170] bg-field px-3 focus-within:ring-2 focus-within:ring-ring sm:flex-[1_1_240px] lg:max-w-[300px]"
        >
          <Search
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label={t("searchLabel")}
            placeholder={t("searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-caption outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
          />
          {search && (
            <button
              type="button"
              aria-label={t("clear")}
              onClick={() => {
                setSearch("");
                if (query.search) go(href({ search: "" }));
              }}
              className="-me-1 flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <X aria-hidden className="size-4" />
            </button>
          )}
        </form>
        <Select
          value={query.sort}
          onValueChange={(sort) =>
            go(href({ sort: sort as DealershipDetailQuery["sort"] }))
          }
        >
          <SelectTrigger
            aria-label={t("sortLabel")}
            className={cn(trigger, "w-full sm:w-[180px]")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-control">
            {DETAIL_CAR_SORTS.map((sort) => (
              <SelectItem key={sort} value={sort}>
                {t(`sorts.${sort}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <section
        aria-busy={pending}
        className={cn(panel, "transition-opacity", pending && "opacity-60")}
      >
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-caption text-muted-foreground sm:px-5">
            {counts.cars === 0 ? t("empty") : t("noMatch")}
          </p>
        ) : (
          <CarsTable cars={rows} />
        )}
        {total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-caption text-muted-foreground sm:px-5">
            <span>
              {t("showing", {
                from: fmt.number(from),
                to: fmt.number(to),
                total: fmt.number(total),
              })}
            </span>
            <Pager page={page} pages={pages} href={(p) => href({ page: p })} />
          </div>
        )}
      </section>
    </div>
  );
}
