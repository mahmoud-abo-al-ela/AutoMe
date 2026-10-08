"use client";

import { useTranslations } from "next-intl";
import { History } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import { useFormatters } from "@/hooks/use-formatters";
import { cairoNow } from "@/lib/utils/datetime";
import { cn } from "@/lib/utils";
import { ACTIVITY_DAYS, ACTIVITY_KINDS, type ActivityKind } from "@/lib/services/audit/activity-filters";
import type { Activity } from "@/lib/services/audit/activity";
import { OrgPageHeader } from "../../_components/OrgPageHeader";
import { inputClass } from "../../_components/form-ui";
import { useDescribeEntry } from "@/components/dashboard/use-describe-entry";

export type ActivityFilters = { kind: ActivityKind; who: string; days: string; page: number };

/**
 * Activity as a feed (canvas: Audit log round 1, "1 · Feed"): one sentence per
 * change, grouped by day in Cairo, newest first, with what changed shown
 * before → after. The filters live in the address, so a filtered view can be
 * shared or bookmarked.
 */
export function ActivityFeed({
  activity,
  filters,
  base,
  dealershipName,
  retention,
}: {
  activity: Activity;
  filters: ActivityFilters;
  base: string;
  dealershipName: string;
  retention: string;
}) {
  const t = useTranslations("org.auditLogs");
  const fmt = useFormatters();
  const router = useRouter();
  // `base` is /org/{slug}/audit-logs; a car links to its editor beside it.
  const orgBase = base.replace(/\/audit-logs$/, "");
  const describe = useDescribeEntry(activity.lookups, dealershipName, { carHref: (carId) => `${orgBase}/cars/${carId}/edit` });
  const { entries, people, pagination } = activity;

  const href = (next: Partial<ActivityFilters>) => {
    const merged = { ...filters, page: 1, ...next };
    const params = new URLSearchParams();
    if (merged.kind !== "all") params.set("kind", merged.kind);
    if (merged.who) params.set("who", merged.who);
    if (merged.days !== "30") params.set("days", merged.days);
    if (merged.page > 1) params.set("page", String(merged.page));
    const query = params.toString();
    return query ? `${base}?${query}` : base;
  };

  // Grouped by the day in Cairo, the dealership's own calendar.
  const today = cairoNow().date;
  const yesterday = cairoNow(new Date(Date.now() - 24 * 60 * 60 * 1000)).date;
  const days: { day: string; items: typeof entries }[] = [];
  for (const entry of entries) {
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
        : fmt.date(`${day}T00:00:00Z`, { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
  const filtered = filters.kind !== "all" || !!filters.who || filters.days !== "30";

  return (
    <div className="flex w-full flex-col gap-5">
      <OrgPageHeader title={t("title")} description={`${t("subtitle")} ${retention}`} className="mb-0 md:mb-0" />

      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        <nav aria-label={t("kinds.label")} className="flex flex-wrap gap-2">
          {ACTIVITY_KINDS.map((kind) => (
            <Link
              key={kind}
              href={href({ kind })}
              aria-current={filters.kind === kind ? "page" : undefined}
              className={cn(
                "flex h-10 items-center whitespace-nowrap rounded-full px-4 text-caption font-semibold transition-colors sm:h-11",
                filters.kind === kind ? "bg-inverse text-inverse-foreground" : "border border-[#8c8170] bg-card hover:bg-muted",
              )}
            >
              {t(`kinds.${kind}`)}
            </Link>
          ))}
        </nav>
        <span aria-hidden className="hidden flex-1 md:block" />
        <div className="grid grid-cols-2 gap-2 md:flex">
          <Select value={filters.who || "everyone"} onValueChange={(who) => router.push(href({ who: who === "everyone" ? "" : who }))}>
            <SelectTrigger aria-label={t("who.label")} className={cn(inputClass(), "justify-between md:w-48")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">{t("who.everyone")}</SelectItem>
              {people.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  <bdi>{person.name}</bdi>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.days} onValueChange={(days) => router.push(href({ days }))}>
            <SelectTrigger aria-label={t("days.label")} className={cn(inputClass(), "justify-between md:w-44")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[...ACTIVITY_DAYS.map(String), "all"].map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`days.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[20px] border border-border bg-card px-6 py-14 text-center">
          <History aria-hidden className="size-9 text-muted-foreground/60" />
          <p className="text-body font-semibold">{t("empty.title")}</p>
          <p className="max-w-[46ch] text-caption text-muted-foreground">{filtered ? t("empty.filtered") : t("empty.body")}</p>
        </div>
      ) : (
        days.map(({ day, items }) => (
          <section key={day} aria-labelledby={`day-${day}`} className="flex flex-col gap-2">
            <h2 id={`day-${day}`} className="flex items-center gap-3 text-caption font-extrabold after:h-px after:flex-1 after:bg-border">
              {dayLabel(day)}
            </h2>
            <ol className="overflow-hidden rounded-[20px] border border-border bg-card">
              {items.map((entry) => {
                const { sentence, changes } = describe(entry);
                const support = entry.action.startsWith("IMPERSONATION_") || entry.bySupport;
                const name = entry.action.startsWith("IMPERSONATION_") ? "A" : entry.who || "A";
                return (
                  <li key={entry.id} className="grid grid-cols-[40px_minmax(0,1fr)] gap-x-3.5 gap-y-1 border-t border-border px-4 py-3.5 first:border-t-0 sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:px-5">
                    <span
                      aria-hidden
                      className={cn(
                        "row-span-2 flex size-10 items-center justify-center rounded-full text-caption font-extrabold",
                        support ? "bg-[#fff1c2] text-[#8a5e00]" : "bg-[#e7eef8] text-[#1d4e9e]",
                      )}
                    >
                      {initials(name)}
                    </span>
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <p className="text-body text-muted-foreground">
                        {sentence}
                        {support && (
                          <span className="ms-2 inline-block rounded-full bg-[#fff1c2] px-2 py-px align-middle text-micro font-bold text-[#8a5e00]">
                            {t("supportTag")}
                          </span>
                        )}
                      </p>
                      {entry.bySupport && entry.who && <p className="text-caption text-muted-foreground">{t("bySupport", { name: entry.who })}</p>}
                      {changes.length > 0 && (
                        <ul className="flex flex-col gap-1">
                          {changes.map((change) => (
                            <li key={change.key} className="flex w-fit max-w-full flex-wrap items-center gap-x-2 rounded-control bg-background px-2.5 py-1 text-caption">
                              <span className="text-muted-foreground">{change.label}</span>
                              {change.before && (
                                <>
                                  <bdi className="text-muted-foreground line-through">{change.before}</bdi>
                                  {/* "Before → after" in reading order: the arrow points forward in both directions. */}
                                  <span aria-hidden className="rtl:-scale-x-100">→</span>
                                </>
                              )}
                              <bdi className="font-semibold">{change.after}</bdi>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <time dateTime={entry.createdAt} className="col-start-2 text-caption text-muted-foreground sm:col-start-3 sm:row-start-1 sm:whitespace-nowrap sm:pt-0.5">
                      {fmt.time(entry.createdAt)}
                    </time>
                  </li>
                );
              })}
            </ol>
          </section>
        ))
      )}

      {pagination.totalPages > 1 && (
        <nav aria-label={t("pages.label")} className="flex items-center justify-between gap-3 text-caption text-muted-foreground">
          <span className="tabular-nums">
            {t("pages.status", { page: fmt.number(pagination.page), total: fmt.number(pagination.totalPages) })}
          </span>
          <span className="flex gap-2">
            {pagination.page > 1 && (
              <Link href={href({ page: pagination.page - 1 })} className={cn(buttonVariants({ variant: "outline-strong", size: "control" }), "h-11 border bg-field")}>
                {t("pages.newer")}
              </Link>
            )}
            {pagination.page < pagination.totalPages && (
              <Link href={href({ page: pagination.page + 1 })} className={cn(buttonVariants({ variant: "outline-strong", size: "control" }), "h-11 border bg-field")}>
                {t("pages.older")}
              </Link>
            )}
          </span>
        </nav>
      )}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
