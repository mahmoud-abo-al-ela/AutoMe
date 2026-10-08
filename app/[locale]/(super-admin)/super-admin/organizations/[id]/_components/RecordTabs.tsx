"use client";

import { useState, useTransition, type ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { CarFront, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { useDescribeEntry } from "@/components/dashboard/use-describe-entry";
import { useActionError } from "@/hooks/use-action-error";
import { useFormatters } from "@/hooks/use-formatters";
import { formatPlanAmount } from "@/lib/utils/currency";
import { cairoNow } from "@/lib/utils/datetime";
import { cn } from "@/lib/utils";
import { changeOrganizationPlan } from "@/actions/super-admin";
import {
  DETAIL_ACTIVITY_DAYS,
  DETAIL_ACTIVITY_KINDS,
  DETAIL_CARS_PER_PAGE,
  DETAIL_CAR_SORTS,
  DETAIL_CAR_STATUSES,
  dealershipDetailHref,
  type DealershipDetailQuery,
} from "@/lib/services/super-admin/dealerships-options";
import type { DealershipDetail } from "@/lib/services/super-admin/dealership-detail";
import ImpersonateModal from "../../_components/ImpersonateModal";

type Car = Extract<
  DealershipDetail,
  { summary: unknown }
>["summary"]["cars"][number];

const panel = "overflow-hidden rounded-[20px] border border-border bg-card";
const th =
  "px-3 py-3 text-center font-semibold first:ps-4 first:text-start sm:first:ps-5";
const td = "px-3 py-3 text-center first:ps-4 first:text-start sm:first:ps-5";
const chip =
  "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-caption transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const chipOn =
  "border-inverse bg-inverse font-semibold text-inverse-foreground";
const chipOff = "border-border bg-field text-foreground hover:bg-muted";
const trigger = "h-10 data-[size=default]:h-10 rounded-control border-[#8c8170] bg-field";
const CAR_TONES: Record<string, string> = {
  AVAILABLE: "bg-positive-soft text-positive",
  UNAVAILABLE: "bg-muted text-muted-foreground",
  SOLD: "bg-[#e7eef8] text-[#1d4e9e]",
};
const PAYMENT_TONES: Record<string, string> = {
  PAID: "bg-positive-soft text-positive",
  FAILED: "bg-destructive-soft text-destructive",
  REFUNDED: "bg-muted text-muted-foreground",
  EXPIRED: "bg-muted text-muted-foreground",
  PENDING: "bg-[#fff1c2] text-[#7a5200]",
};

/** Moves the page to another URL inside a transition, so the content dims rather than blanks. */
function useGo() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return {
    pending,
    go: (href: string) =>
      startTransition(() => router.replace(href, { scroll: false })),
  };
}

/** Previous, numbered and next page links, for a tab with more than one page. */
export function Pager({
  page,
  pages,
  href,
}: {
  page: number;
  pages: number;
  href: (page: number) => string;
}) {
  const t = useTranslations("superAdmin.organizations.details.pagination");
  const fmt = useFormatters();
  if (pages <= 1) return null;
  const link =
    "flex size-10 items-center justify-center rounded-control border border-border bg-field text-caption font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const shown = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => pages <= 7 || p === 1 || p === pages || Math.abs(p - page) <= 1,
  );
  return (
    <nav aria-label={t("label")} className="flex items-center gap-1.5">
      <Link
        href={href(Math.max(1, page - 1))}
        scroll={false}
        aria-label={t("previous")}
        aria-disabled={page === 1}
        className={cn(link, page === 1 && "pointer-events-none opacity-40")}
      >
        <ChevronLeft aria-hidden className="size-4 rtl:-scale-x-100" />
      </Link>
      {shown.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - shown[i - 1] > 1 && <span aria-hidden>…</span>}
          <Link
            href={href(p)}
            scroll={false}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              link,
              p === page && "border-inverse bg-inverse text-inverse-foreground",
            )}
          >
            {fmt.number(p)}
          </Link>
        </span>
      ))}
      <Link
        href={href(Math.min(pages, page + 1))}
        scroll={false}
        aria-label={t("next")}
        aria-disabled={page === pages}
        className={cn(link, page === pages && "pointer-events-none opacity-40")}
      >
        <ChevronRight aria-hidden className="size-4 rtl:-scale-x-100" />
      </Link>
    </nav>
  );
}

/** A car's first photo, or a plain car shape when it has none. */
function Thumb({ src }: { src: string | null }) {
  return (
    <span className="relative flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-muted text-muted-foreground">
      {src ? (
        <Image src={src} alt="" fill sizes="64px" className="object-cover" />
      ) : (
        <CarFront aria-hidden className="size-5" />
      )}
    </span>
  );
}

/**
 * Cars as rows — photo, name, price, status, buyer interest and how long it
 * has been listed. The summary shows the newest five; the Cars tab, a page.
 */
export function CarsTable({
  cars,
  interest = true,
}: {
  cars: Car[];
  interest?: boolean;
}) {
  const t = useTranslations("superAdmin.organizations.details.cars");
  const tStatus = useTranslations("org.cars.ledger.status");
  const fmt = useFormatters();
  const today = cairoNow().date;
  const listed = (iso: string) => {
    const days = Math.round(
      (Date.parse(`${today}T00:00:00Z`) -
        Date.parse(`${cairoNow(new Date(iso)).date}T00:00:00Z`)) /
        86_400_000,
    );
    return days <= 0
      ? t("today")
      : t("days", { count: days, value: fmt.number(days) });
  };
  const name = (car: Car) => (
    <bdi>
      {car.make} {car.model} {fmt.number(car.year, { useGrouping: false })}
    </bdi>
  );
  const status = (car: Car) => (
    <span
      className={cn(
        "whitespace-nowrap rounded-full px-2.5 py-0.5 text-micro font-bold",
        CAR_TONES[car.status],
      )}
    >
      {tStatus(car.status)}
    </span>
  );
  return (
    <>
      {/* Phones: one card per car, the interest as three small figures. */}
      <ul className="flex flex-col border-t border-border lg:hidden">
        {cars.map((car) => (
          <li
            key={car.id}
            className="flex flex-col gap-2.5 border-b border-border px-4 py-3 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <Thumb src={car.image} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{name(car)}</p>
                <p className="text-micro text-muted-foreground">
                  {fmt.mileage(car.mileage)}
                  {fmt.locale === "ar" ? "، " : ", "}
                  {listed(car.createdAt)}
                </p>
              </div>
              {status(car)}
            </div>
            <div className="flex items-end justify-between gap-3">
              <p className="font-semibold tabular-nums">
                {fmt.price(car.price)}
              </p>
              {interest && (
                <dl className="flex gap-4 text-center text-micro text-muted-foreground">
                  {(
                    [
                      ["saves", car.saves],
                      ["questions", car.questions],
                      ["drives", car.drives],
                    ] as const
                  ).map(([key, value]) => (
                    <div key={key}>
                      <dd className="text-caption font-semibold text-foreground tabular-nums">
                        {fmt.number(value)}
                      </dd>
                      <dt>{t(key)}</dt>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="relative hidden overflow-x-auto lg:block">
        <table
          className={cn(
            "w-full border-collapse text-caption",
            interest ? "min-w-[880px]" : "min-w-[600px]",
          )}
        >
          <thead>
            <tr className="whitespace-nowrap border-y border-border bg-muted/60 text-muted-foreground">
              <th scope="col" className={th}>
                {t("car")}
              </th>
              <th scope="col" className={th}>
                {t("price")}
              </th>
              <th scope="col" className={th}>
                {t("status")}
              </th>
              {interest && (
                <>
                  <th scope="col" className={th}>
                    {t("saves")}
                  </th>
                  <th scope="col" className={th}>
                    {t("questions")}
                  </th>
                  <th scope="col" className={th}>
                    {t("drives")}
                  </th>
                </>
              )}
              <th scope="col" className={th}>
                {t("listed")}
              </th>
            </tr>
          </thead>
          <tbody>
            {cars.map((car) => (
              <tr
                key={car.id}
                className="border-b border-border last:border-b-0"
              >
                <td className={td}>
                  <div className="flex items-center gap-3">
                    <Thumb src={car.image} />
                    <div className="min-w-0">
                      <p className="font-semibold">
                        <bdi>
                          {car.make} {car.model}{" "}
                          {fmt.number(car.year, { useGrouping: false })}
                        </bdi>
                      </p>
                      <p className="text-micro text-muted-foreground">
                        {fmt.mileage(car.mileage)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className={cn(td, "whitespace-nowrap tabular-nums")}>
                  {fmt.price(car.price)}
                </td>
                <td className={td}>
                  <span
                    className={cn(
                      "whitespace-nowrap rounded-full px-2.5 py-0.5 text-micro font-bold",
                      CAR_TONES[car.status],
                    )}
                  >
                    {tStatus(car.status)}
                  </span>
                </td>
                {interest && (
                  <>
                    <td className={cn(td, "tabular-nums")}>
                      {fmt.number(car.saves)}
                    </td>
                    <td className={cn(td, "tabular-nums")}>
                      {fmt.number(car.questions)}
                    </td>
                    <td className={cn(td, "tabular-nums")}>
                      {fmt.number(car.drives)}
                    </td>
                  </>
                )}
                <td
                  className={cn(td, "whitespace-nowrap text-muted-foreground")}
                >
                  {listed(car.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

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

/**
 * The Team tab (canvas: dealership tabs round 1, "Team A · People table"):
 * each person with their role, when they joined and what they have done, and
 * a support session as them; beside it the seats the plan allows and anyone
 * invited who has not signed in yet.
 */
export function TeamTab({
  data,
}: {
  data: Extract<DealershipDetail, { team: unknown }>;
}) {
  const t = useTranslations("superAdmin.organizations.details.team");
  const tRoles = useTranslations("org.settings.team.roles");
  const tPlans = useTranslations("plans");
  const fmt = useFormatters();
  const [signingInAs, setSigningInAs] = useState<string | null>(null);
  const { team, seats, dealership: org, subscription: sub } = data;
  const planKey = planKeyFor(sub?.plan.type ?? "STARTER");
  const planName = planKey
    ? tPlans(`plans.${planKey}.name`)
    : (sub?.plan.name ?? "");
  const pending = team.filter((member) => member.pending);
  const initials = (name: string) =>
    name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  const rich = {
    b: (chunks: ReactNode) => (
      <b className="font-semibold text-foreground">{chunks}</b>
    ),
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section aria-labelledby="people" className={panel}>
        <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <h2 id="people" className="text-[1.25rem] font-extrabold">
            {t("people")}
          </h2>
        </header>
        {team.length === 0 ? (
          <p className="border-t border-border px-4 py-5 text-caption text-muted-foreground sm:px-5">
            {t("empty")}
          </p>
        ) : (
          <>
            {/* Phones: one card per person. */}
            <ul className="flex flex-col border-t border-border lg:hidden">
              {team.map((member) => {
                const name = member.user.name || member.user.email || "";
                return (
                  <li
                    key={member.id}
                    className="flex flex-col gap-3 border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e7eef8] text-micro font-extrabold text-[#1d4e9e]"
                      >
                        {initials(name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">
                          <bdi>{name}</bdi>
                        </p>
                        {member.user.name && member.user.email && (
                          <p
                            className="truncate text-micro text-muted-foreground"
                            dir="ltr"
                          >
                            {member.user.email}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-micro font-bold",
                          member.role === "OWNER"
                            ? "bg-[#e7eef8] text-[#1d4e9e]"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {tRoles(member.role)}
                      </span>
                    </div>
                    {member.pending && (
                      <p className="text-micro font-semibold text-[#7a5200]">
                        {t("notSignedIn")}
                      </p>
                    )}
                    <dl className="grid grid-cols-3 gap-2 text-micro text-muted-foreground">
                      {(
                        [
                          [
                            t("joined"),
                            fmt.date(member.joinedAt, { year: undefined }),
                          ],
                          [t("carsAdded"), fmt.number(member.carsAdded)],
                          [t("changes"), fmt.number(member.recentChanges)],
                        ] as const
                      ).map(([label, value]) => (
                        <div key={label}>
                          <dd className="text-caption font-semibold text-foreground tabular-nums">
                            {value}
                          </dd>
                          <dt>{label}</dt>
                        </div>
                      ))}
                    </dl>
                    <Button
                      variant="outline-strong"
                      size="sm"
                      className="h-10 w-full bg-field"
                      onClick={() => setSigningInAs(member.user.id)}
                    >
                      {t("signInAs", {
                        name: (member.user.name || name).split(" ")[0],
                      })}
                    </Button>
                  </li>
                );
              })}
            </ul>
            <div className="relative hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[820px] border-collapse text-caption">
                <thead>
                  <tr className="whitespace-nowrap border-y border-border bg-muted/60 text-muted-foreground">
                    <th scope="col" className={th}>
                      {t("person")}
                    </th>
                    <th scope="col" className={th}>
                      {t("role")}
                    </th>
                    <th scope="col" className={th}>
                      {t("joined")}
                    </th>
                    <th scope="col" className={th}>
                      {t("carsAdded")}
                    </th>
                    <th scope="col" className={th}>
                      {t("changes")}
                    </th>
                    <th scope="col" className={th}>
                      <span className="sr-only">
                        {t("signInAs", { name: "" })}
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((member) => {
                    const name = member.user.name || member.user.email || "";
                    return (
                      <tr
                        key={member.id}
                        className="border-b border-border last:border-b-0"
                      >
                        <td className={td}>
                          <div className="flex items-center gap-3">
                            <span
                              aria-hidden
                              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e7eef8] text-micro font-extrabold text-[#1d4e9e]"
                            >
                              {initials(name)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold">
                                <bdi>{name}</bdi>
                              </p>
                              {member.user.name && member.user.email && (
                                <p
                                  className="text-micro text-muted-foreground"
                                  dir="ltr"
                                >
                                  {member.user.email}
                                </p>
                              )}
                              {member.pending && (
                                <p className="text-micro font-semibold text-[#7a5200]">
                                  {t("notSignedIn")}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={td}>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-micro font-bold",
                              member.role === "OWNER"
                                ? "bg-[#e7eef8] text-[#1d4e9e]"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {tRoles(member.role)}
                          </span>
                        </td>
                        <td
                          className={cn(
                            td,
                            "whitespace-nowrap text-muted-foreground",
                          )}
                        >
                          {fmt.date(member.joinedAt)}
                        </td>
                        <td className={cn(td, "tabular-nums")}>
                          {fmt.number(member.carsAdded)}
                        </td>
                        <td className={cn(td, "tabular-nums")}>
                          {fmt.number(member.recentChanges)}
                        </td>
                        <td className={cn(td, "pe-4 text-end sm:pe-5")}>
                          <Button
                            variant="outline-strong"
                            size="sm"
                            className="h-9 bg-field"
                            onClick={() => setSigningInAs(member.user.id)}
                          >
                            {t("signInAs", {
                              name: (member.user.name || name).split(" ")[0],
                            })}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <div className="flex flex-col gap-6">
        {seats !== null && (
          <section
            aria-labelledby="seats"
            className="rounded-[20px] border border-border bg-card px-4 py-4 sm:px-[22px]"
          >
            <h2 id="seats" className="text-[1.25rem] font-extrabold">
              {t("seats")}
            </h2>
            <p className="mt-1 text-caption text-muted-foreground">
              {seats < 0
                ? t("seatsUnlimited", {
                    used: fmt.number(team.length),
                    plan: planName,
                  })
                : t("seatsLine", {
                    used: fmt.number(team.length),
                    limit: fmt.number(seats),
                    plan: planName,
                  })}
            </p>
            <div
              aria-hidden
              className={cn("mt-3 flex gap-1.5", seats < 0 && "hidden")}
            >
              {Array.from({ length: Math.min(seats, 20) }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-3 flex-1 rounded-full",
                    i < team.length - pending.length
                      ? "bg-chart-1"
                      : i < team.length
                        ? "bg-[#e0a400]"
                        : "bg-muted",
                  )}
                />
              ))}
            </div>
          </section>
        )}
        <section
          aria-labelledby="invitations"
          className="rounded-[20px] border border-border bg-card px-4 py-4 sm:px-[22px]"
        >
          <h2 id="invitations" className="text-[1.25rem] font-extrabold">
            {t("invitations")}
          </h2>
          <ul className="mt-2 flex flex-col gap-2 text-caption text-muted-foreground">
            {org.pendingOwnerEmail && (
              <li>
                {t.rich("ownerInvite", {
                  email: org.pendingOwnerEmail,
                  ...rich,
                })}
              </li>
            )}
            {pending.map((member) => (
              <li key={member.id}>
                {t.rich("memberPending", {
                  name: member.user.name || member.user.email || "",
                  ...rich,
                })}
              </li>
            ))}
            {!org.pendingOwnerEmail && pending.length === 0 && (
              <li>{t("noInvitations")}</li>
            )}
          </ul>
        </section>
      </div>

      {signingInAs && (
        <ImpersonateModal
          organization={org}
          userId={signingInAs}
          onClose={() => setSigningInAs(null)}
        />
      )}
    </div>
  );
}

/**
 * The Billing tab (canvas: dealership tabs round 1, "Billing C · Plans
 * first"): the plans side by side with the current one marked and where it
 * stands, a move to any other — which asks first — then every payment.
 */
export function BillingTab({
  data,
}: {
  data: Extract<DealershipDetail, { payments: unknown }>;
}) {
  const t = useTranslations("superAdmin.organizations.details.billing");
  const tPlan = useTranslations("superAdmin.organizations.details.plans");
  const tSub = useTranslations("superAdmin.organizations.details.subscription");
  const tCommon = useTranslations("superAdmin.common");
  const tPayments = useTranslations("org.billing.payments");
  const tPlans = useTranslations("plans");
  const fmt = useFormatters();
  const actionError = useActionError();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [moving, setMoving] = useState<(typeof data.plans)[number] | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const { subscription: sub, dealership: org, counts } = data;
  const currentType = sub?.plan.type ?? "STARTER";
  const planName = (plan: { type: string; name: string }) => {
    const key = planKeyFor(plan.type);
    return key ? tPlans(`plans.${key}.name`) : plan.name;
  };
  const amount = (minor: number) => formatPlanAmount(minor, fmt.locale);
  const day = (iso: string) => fmt.date(iso, { year: undefined });
  const longDay = (date: string) =>
    fmt.date(`${date}T00:00:00Z`, {
      month: "long",
      year: undefined,
      timeZone: "UTC",
    });
  const method = (p: (typeof data.payments)[number]) =>
    p.maskedPan
      ? t("card", { last4: p.maskedPan.slice(-4) })
      : p.method === "wallet"
        ? t("wallet")
        : t("unknownMethod");

  const standing = (() => {
    if (!sub) return null;
    if (sub.status === "PAST_DUE")
      return {
        tone: "text-destructive",
        text: tPlan("unpaid", {
          date: sub.pastDueSince ? day(sub.pastDueSince) : "",
          drops: sub.dropsOn ? longDay(sub.dropsOn) : "",
        }),
      };
    if (sub.status === "TRIALING" && sub.trialEndsAt)
      return {
        tone: "text-[#7a5200]",
        text: tPlan("trial", { date: day(sub.trialEndsAt) }),
      };
    if (sub.periodEnd)
      return {
        tone: "text-muted-foreground",
        text: sub.cancelAtPeriodEnd
          ? tPlan("cancels", { date: day(sub.periodEnd) })
          : tPlan("paidUntil", { date: day(sub.periodEnd) }),
      };
    return null;
  })();

  const move = async () => {
    if (!moving) return;
    setSaving(true);
    try {
      const result = await changeOrganizationPlan(org.id, moving.id);
      if (result.success) {
        toast.success(tSub("updated"), {
          description: tSub("updatedBody", { plan: planName(moving) }),
        });
        startTransition(() => router.refresh());
      } else {
        toast.error(tSub("updateFailed"), {
          description: actionError(result.error, tCommon("errorBody")),
        });
      }
    } catch {
      toast.error(tCommon("errorTitle"), { description: tCommon("errorBody") });
    } finally {
      setSaving(false);
      setMoving(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="plans" className="flex flex-col gap-3">
        <h2 id="plans" className="sr-only">
          {tPlan("title")}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {data.plans.map((plan) => {
            const current = plan.type === currentType;
            return (
              <article
                key={plan.id}
                className={cn(
                  "flex flex-col gap-2 rounded-[20px] border bg-card px-5 py-4",
                  current ? "border-2 border-[#1d4e9e]" : "border-border",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[1.25rem] font-extrabold">
                    {planName(plan)}
                  </h3>
                  {current && (
                    <span className="rounded-full bg-[#e7eef8] px-2.5 py-0.5 text-micro font-bold text-[#1d4e9e]">
                      {tPlan("current")}
                    </span>
                  )}
                </div>
                <p className="text-[1.25rem] font-extrabold tabular-nums">
                  {plan.monthlyPrice > 0
                    ? tPlan("perMonthPrice", {
                        amount: amount(plan.monthlyPrice),
                      })
                    : tPlan("free")}
                </p>
                <ul className="flex flex-col gap-0.5 text-caption text-muted-foreground">
                  {/* A negative limit means none. */}
                  <li>
                    {plan.maxCars < 0
                      ? tPlan("carsUnlimited")
                      : tPlan("cars", { value: fmt.number(plan.maxCars) })}
                  </li>
                  <li>
                    {plan.maxMembers < 0
                      ? tPlan("peopleUnlimited")
                      : tPlan("people", { value: fmt.number(plan.maxMembers) })}
                  </li>
                  <li>
                    {tPlan("photos", {
                      value: fmt.number(plan.maxImagesPerCar),
                    })}
                  </li>
                </ul>
                <div className="mt-auto pt-2">
                  {current ? (
                    standing && (
                      <p
                        className={cn(
                          "text-caption font-semibold",
                          standing.tone,
                        )}
                      >
                        {standing.text}
                      </p>
                    )
                  ) : (
                    <Button
                      variant="outline-strong"
                      size="sm"
                      className="h-10 w-full bg-field"
                      onClick={() => setMoving(plan)}
                    >
                      {tPlan("moveTo", { plan: planName(plan) })}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="payments" className={panel}>
        <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <h2 id="payments" className="text-[1.25rem] font-extrabold">
            {t("payments")}
          </h2>
          {counts.paidCents > 0 && (
            <span className="text-caption text-muted-foreground">
              {tPlan("paidSoFar", { amount: amount(counts.paidCents) })}
            </span>
          )}
        </header>
        {data.payments.length === 0 ? (
          <p className="border-t border-border px-4 py-5 text-caption text-muted-foreground sm:px-5">
            {t("empty")}
          </p>
        ) : (
          <>
            {/* Phones: one row per payment, the amount and result first. */}
            <ul className="flex flex-col border-t border-border lg:hidden">
              {data.payments.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-1 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold tabular-nums">
                      {amount(p.amountCents)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-micro font-bold",
                        PAYMENT_TONES[p.status] ?? PAYMENT_TONES.EXPIRED,
                      )}
                    >
                      {tPayments(`statuses.${p.status}`)}
                    </span>
                  </div>
                  <p className="text-caption">
                    {tPayments(`purposes.${p.purpose}`, {
                      plan: planName(p.plan),
                      period: p.billingPeriod,
                    })}
                  </p>
                  <p className="text-micro text-muted-foreground">
                    {fmt.date(p.paidAt ?? p.createdAt)}
                    {fmt.locale === "ar" ? "، " : ", "}
                    {method(p)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="relative hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[720px] border-collapse text-caption">
                <thead>
                  <tr className="whitespace-nowrap border-y border-border bg-muted/60 text-muted-foreground">
                    <th scope="col" className={th}>
                      {t("date")}
                    </th>
                    <th scope="col" className={th}>
                      {t("what")}
                    </th>
                    <th scope="col" className={th}>
                      {t("amount")}
                    </th>
                    <th scope="col" className={th}>
                      {t("method")}
                    </th>
                    <th scope="col" className={th}>
                      {t("result")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className={cn(td, "whitespace-nowrap")}>
                        {fmt.date(p.paidAt ?? p.createdAt)}
                      </td>
                      <td className={td}>
                        {tPayments(`purposes.${p.purpose}`, {
                          plan: planName(p.plan),
                          period: p.billingPeriod,
                        })}
                      </td>
                      <td className={cn(td, "tabular-nums")}>
                        {amount(p.amountCents)}
                      </td>
                      <td className={td}>{method(p)}</td>
                      <td className={td}>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-micro font-bold",
                            PAYMENT_TONES[p.status] ?? PAYMENT_TONES.EXPIRED,
                          )}
                        >
                          {tPayments(`statuses.${p.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <AlertDialog
        open={moving !== null}
        onOpenChange={(open) => !open && !saving && setMoving(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {moving &&
                tPlan("dialogTitle", {
                  name: org.name,
                  plan: planName(moving),
                })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tPlan("dialogBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" disabled={saving}>
              {tPlan("dialogKeep")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                move();
              }}
            >
              {saving
                ? tPlan("moving")
                : moving && tPlan("dialogConfirm", { plan: planName(moving) })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/**
 * The Activity tab (canvas: dealership tabs round 1, "Activity A · Feed with
 * filters"): kind chips, who and when, then the changes grouped by day in
 * Cairo, each as a sentence with what it changed shown before → after.
 */
export function ActivityTab({
  data,
  base,
}: {
  data: Extract<DealershipDetail, { activity: unknown }>;
  base: string;
}) {
  const t = useTranslations("org.auditLogs");
  const fmt = useFormatters();
  const { go, pending } = useGo();
  const { activity, query, dealership } = data;
  const describe = useDescribeEntry(activity.lookups, dealership.name);
  const href = (next: Partial<DealershipDetailQuery>) =>
    dealershipDetailHref(base, {
      tab: "activity",
      kind: query.kind,
      who: query.who,
      days: query.days,
      page: 1,
      ...next,
    });
  const whoKnown = activity.people.some((person) => person.id === query.who)
    ? query.who
    : "";

  const today = cairoNow().date;
  const yesterday = cairoNow(new Date(Date.now() - 86_400_000)).date;
  const days: { day: string; items: typeof activity.entries }[] = [];
  for (const entry of activity.entries) {
    const day = cairoNow(new Date(entry.createdAt)).date;
    const last = days.at(-1);
    if (last?.day === day) last.items.push(entry);
    else days.push({ day, items: [entry] });
  }
  const dayLabel = (day: string) =>
    day === today
      ? t("today")
      : day === yesterday
        ? t("yesterday")
        : fmt.date(`${day}T00:00:00Z`, {
            weekday: "long",
            month: "long",
            timeZone: "UTC",
          });
  const filtered =
    query.kind !== "all" || Boolean(whoKnown) || query.days !== "30";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <nav
          aria-label={t("kinds.label")}
          className="-mx-4 flex w-[calc(100%+2rem)] gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:w-auto sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {DETAIL_ACTIVITY_KINDS.map((kind) => (
            <Link
              key={kind}
              href={href({ kind })}
              scroll={false}
              aria-current={kind === query.kind ? "page" : undefined}
              className={cn(chip, kind === query.kind ? chipOn : chipOff)}
            >
              {t(`kinds.${kind}`)}
            </Link>
          ))}
        </nav>
        <span className="hidden flex-1 lg:block" />
        <Select
          value={whoKnown || "all"}
          onValueChange={(who) => go(href({ who: who === "all" ? "" : who }))}
        >
          <SelectTrigger
            aria-label={t("who.label")}
            className={cn(trigger, "w-[calc(50%-0.3125rem)] sm:w-[200px]")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-control">
            <SelectItem value="all">{t("who.everyone")}</SelectItem>
            {activity.people.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={query.days}
          onValueChange={(days) =>
            go(href({ days: days as DealershipDetailQuery["days"] }))
          }
        >
          <SelectTrigger
            aria-label={t("days.label")}
            className={cn(trigger, "w-[calc(50%-0.3125rem)] sm:w-[170px]")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-control">
            {DETAIL_ACTIVITY_DAYS.map((days) => (
              <SelectItem key={days} value={days}>
                {t(`days.${days}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <section
        aria-busy={pending}
        className={cn(
          panel,
          "px-4 py-2 transition-opacity sm:px-5",
          pending && "opacity-60",
        )}
      >
        {days.length === 0 ? (
          <p className="py-6 text-center text-caption text-muted-foreground">
            {filtered ? t("empty.filtered") : t("empty.body")}
          </p>
        ) : (
          days.map(({ day, items }) => (
            <div
              key={day}
              className="border-b border-border py-2 last:border-b-0"
            >
              <h3 className="py-2 text-micro font-bold text-muted-foreground">
                {dayLabel(day)}
              </h3>
              <ul className="flex flex-col">
                {items.map((entry) => {
                  const { sentence, changes } = describe(entry);
                  return (
                    <li key={entry.id} className="flex gap-3 py-2">
                      <span
                        aria-hidden
                        className={cn(
                          "mt-2 size-2 shrink-0 rounded-full",
                          entry.bySupport ? "bg-chart-1" : "bg-[#8c8170]",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-caption text-muted-foreground">
                          {sentence}
                          {entry.bySupport && (
                            <span className="ms-2 rounded-full bg-[#e7eef8] px-2 py-px text-micro font-bold text-[#1d4e9e]">
                              {t("supportTag")}
                            </span>
                          )}
                        </p>
                        {changes.length > 0 && (
                          <dl className="mt-1 flex flex-col gap-0.5 text-micro">
                            {changes.map((change) => (
                              <div
                                key={change.key}
                                className="flex flex-wrap gap-x-2"
                              >
                                <dt className="text-muted-foreground">
                                  {change.label}
                                </dt>
                                <dd>
                                  <s className="text-muted-foreground">
                                    {change.before}
                                  </s>{" "}
                                  <span aria-hidden>→</span>{" "}
                                  <b className="font-semibold">
                                    {change.after}
                                  </b>
                                </dd>
                              </div>
                            ))}
                          </dl>
                        )}
                      </div>
                      <time
                        dateTime={entry.createdAt}
                        className="shrink-0 text-micro text-muted-foreground"
                      >
                        {fmt.time(entry.createdAt)}
                      </time>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
        {activity.pagination.totalPages > 1 && (
          <div className="flex justify-end border-t border-border py-3">
            <Pager
              page={activity.pagination.page}
              pages={activity.pagination.totalPages}
              href={(p) => href({ page: p })}
            />
          </div>
        )}
      </section>
    </div>
  );
}
