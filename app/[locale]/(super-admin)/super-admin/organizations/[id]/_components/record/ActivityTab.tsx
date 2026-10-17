"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDescribeEntry } from "@/components/dashboard/use-describe-entry";
import { useFormatters } from "@/hooks/use-formatters";
import { cairoNow } from "@/lib/utils/datetime";
import { cn } from "@/lib/utils";
import {
  DETAIL_ACTIVITY_DAYS,
  DETAIL_ACTIVITY_KINDS,
  dealershipDetailHref,
  type DealershipDetailQuery,
} from "@/lib/services/super-admin/dealerships-options";
import type { DealershipDetail } from "@/lib/services/super-admin/dealership-detail";
import { Pager } from "../../../../_components/Pager";
import { chip, chipOff, chipOn, panel, trigger } from "./record-styles";
import { useGo } from "./use-go";

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
