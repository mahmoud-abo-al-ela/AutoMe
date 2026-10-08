"use client";

import { Fragment, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Download, History } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { OrgPageHeader } from "@/components/dashboard/OrgPageHeader";
import { useDescribeEntry, type Described } from "@/components/dashboard/use-describe-entry";
import { useAuditLabels } from "@/hooks/use-audit-labels";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import { exportActivity } from "@/actions/super-admin";
import { PLATFORM_ACTIVITY_PER_PAGE, platformActivityQueryString } from "@/lib/services/super-admin/platform-activity-options";
import type { PlatformActivity, PlatformActivityEntry, PlatformActivitySource } from "@/lib/services/super-admin/platform-activity";
import { downloadCsv } from "../../organizations/_components/use-dealership-display";
import { Pager } from "../../organizations/[id]/_components/RecordTabs";
import { ActivityToolbar } from "./ActivityToolbar";
import { useActivityDisplay } from "./use-activity-display";

const BASE = "/super-admin/audit-logs";
const th = "px-3 py-3 text-center font-semibold first:ps-5 first:text-start";
const td = "px-3 py-3 text-center first:ps-5 first:text-start";
const SOURCE_TONES: Record<PlatformActivitySource, string> = {
  support: "bg-[#fff1c2] text-[#7a5200]",
  staff: "bg-inverse text-inverse-foreground",
  dealer: "bg-[#e7eef8] text-[#1d4e9e]",
  buyer: "bg-[#e3f3ec] text-[#0e6b4c]",
  removed: "bg-muted text-muted-foreground",
  system: "bg-muted text-foreground",
};
const NO_LOOKUPS: PlatformActivity["lookups"] = { cars: {}, users: {}, memberships: {}, plans: {} };

/**
 * The super-admin Activity page (canvas: Super admin activity round 1, "2 ·
 * Data table"): every change across AutoMe as a row — when, who, what
 * happened, to what, where, and whether a dealer, a buyer, AutoMe staff or a
 * support session made it. A row opens in place to show the change in full:
 * each field before and after, the session it was made in, and the device.
 * Ten to a page; cards below laptop width; the CSV holds what the filters match.
 */
export function ActivityLog({ data }: { data: PlatformActivity }) {
  const t = useTranslations("superAdmin.auditLogs");
  const fmt = useFormatters();
  const label = useAuditLabels();
  const display = useActivityDisplay();
  const describe = useDescribeEntry(data.lookups, "");
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState<{ entries: PlatformActivityEntry[]; lookups: PlatformActivity["lookups"] } | null>(null);
  const describeExported = useDescribeEntry(exported?.lookups ?? NO_LOOKUPS, "");
  const { query, entries, lookups } = data;
  const n = (value: number) => fmt.number(value);

  // The export has its own names to look up, so the CSV is built once they are in.
  useEffect(() => {
    if (!exported) return;
    downloadCsv(
      display.csv(exported.entries, exported.lookups, (entry) => describeExported(entry).changes),
      `autome-activity-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    setExported(null);
  }, [exported, display, describeExported]);

  const exportAll = async () => {
    setExporting(true);
    try {
      const result = await exportActivity(Object.fromEntries(new URLSearchParams(platformActivityQueryString(query))));
      if (result.success && result.data) setExported(result.data);
      else toast.error(t("exportFailed"));
    } catch {
      toast.error(t("exportFailed"));
    } finally {
      setExporting(false);
    }
  };

  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const when = (entry: PlatformActivityEntry) => fmt.dateTime(entry.createdAt, { year: undefined });
  const source = (entry: PlatformActivityEntry) => (
    <span className={cn("whitespace-nowrap rounded-full px-2.5 py-0.5 text-micro font-bold", SOURCE_TONES[entry.source])}>{t(`sources.${entry.source}`)}</span>
  );
  const who = (entry: PlatformActivityEntry) => {
    const as = display.signedInAs(entry, lookups);
    return (
      <span className="inline-flex flex-col">
        {entry.actorId ? (
          <Link href={`/super-admin/users/${entry.actorId}`} className="font-semibold underline-offset-2 hover:text-[#1d4e9e] hover:underline">
            <bdi>{display.who(entry)}</bdi>
          </Link>
        ) : (
          <span className="font-semibold">{display.who(entry)}</span>
        )}
        {as && (
          <span className="text-micro text-muted-foreground">
            <bdi>{t("signedInAs", { name: as })}</bdi>
          </span>
        )}
      </span>
    );
  };
  const target = (entry: PlatformActivityEntry) => {
    const found = display.target(entry, lookups);
    if (!found) return <span className="text-muted-foreground">—</span>;
    return found.href ? (
      <Link href={found.href} className="font-semibold text-[#1d4e9e] underline-offset-2 hover:underline">
        <bdi>{found.label}</bdi>
      </Link>
    ) : (
      <bdi>{found.label}</bdi>
    );
  };
  const dealership = (entry: PlatformActivityEntry) =>
    entry.dealership ? (
      <Link href={`/super-admin/organizations/${entry.dealership.id}`} className="font-semibold text-[#1d4e9e] underline-offset-2 hover:underline">
        <bdi>{entry.dealership.name}</bdi>
      </Link>
    ) : (
      <span className="text-muted-foreground">—</span>
    );
  const toggleButton = (entry: PlatformActivityEntry, full = false) => {
    const on = open.has(entry.id);
    return (
      <button
        type="button"
        aria-expanded={on}
        aria-controls={`entry-${entry.id}`}
        aria-label={t("detailsFor", { action: label.action(entry.action), time: when(entry) })}
        onClick={() => toggle(entry.id)}
        className={cn(
          "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-control border-2 border-border-strong bg-field px-3 text-caption font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          full && "h-10 w-full",
        )}
      >
        {on ? t("hide") : t("details")}
        <ChevronDown aria-hidden className={cn("size-4 transition-transform motion-reduce:transition-none", on && "rotate-180")} />
      </button>
    );
  };

  const from = data.total === 0 ? 0 : (query.page - 1) * PLATFORM_ACTIVITY_PER_PAGE + 1;
  const to = Math.min(query.page * PLATFORM_ACTIVITY_PER_PAGE, data.total);

  return (
    <div className="flex flex-col gap-5">
      <OrgPageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button variant="outline-strong" size="control" className="h-11 bg-field" onClick={exportAll} disabled={exporting || data.total === 0}>
            <Download aria-hidden className="size-4" />
            {exporting ? t("exporting") : t("export")}
          </Button>
        }
        className="mb-0 md:mb-0"
      />

      <ActivityToolbar
        key={platformActivityQueryString({ ...query, page: 1 })}
        query={query}
        dealerships={data.dealerships}
        startTransition={startTransition}
      />

      <section aria-label={t("title")} aria-busy={pending} className={cn("overflow-hidden rounded-[20px] border border-border bg-card transition-opacity", pending && "opacity-60")}>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <History aria-hidden className="size-8 text-muted-foreground" />
            <p className="text-body font-semibold">{t("empty")}</p>
            <p className="text-caption text-muted-foreground">{t("emptyHint")}</p>
          </div>
        ) : (
          <>
            {/* Phones and tablets: one card per change, opening in place. */}
            <ul className="flex flex-col lg:hidden">
              {entries.map((entry) => (
                <li key={entry.id} className={cn("flex flex-col gap-2 border-b border-border px-4 py-3 last:border-b-0", open.has(entry.id) && "bg-muted/40")}>
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold">{label.action(entry.action)}</span>
                    <span className="shrink-0 text-micro text-muted-foreground">{when(entry)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption">
                    {who(entry)}
                    {display.target(entry, lookups) && (
                      <>
                        <span aria-hidden className="text-muted-foreground">·</span>
                        {target(entry)}
                      </>
                    )}
                    {entry.dealership && (
                      <>
                        <span aria-hidden className="text-muted-foreground">·</span>
                        {dealership(entry)}
                      </>
                    )}
                  </div>
                  <div>{source(entry)}</div>
                  {open.has(entry.id) && <EntryDetails id={`entry-${entry.id}`} entry={entry} described={describe(entry)} display={display} lookups={lookups} />}
                  {toggleButton(entry, true)}
                </li>
              ))}
            </ul>

            <div className="relative hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1000px] border-collapse text-caption">
                <thead>
                  <tr className="whitespace-nowrap border-b border-border bg-muted/60 text-muted-foreground">
                    <th scope="col" className={th}>{t("columns.when")}</th>
                    <th scope="col" className={th}>{t("columns.who")}</th>
                    <th scope="col" className={th}>{t("columns.what")}</th>
                    <th scope="col" className={th}>{t("columns.target")}</th>
                    <th scope="col" className={th}>{t("columns.dealership")}</th>
                    <th scope="col" className={th}>{t("columns.source")}</th>
                    <th scope="col" className="w-32 px-3 py-3">
                      <span className="sr-only">{t("columns.details")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const on = open.has(entry.id);
                    return (
                      <Fragment key={entry.id}>
                        <tr className={cn("border-b border-border", on && "border-b-0 bg-muted/40")}>
                          <td className={cn(td, "whitespace-nowrap text-muted-foreground")}>{when(entry)}</td>
                          <td className={td}>{who(entry)}</td>
                          <td className={cn(td, "font-semibold")}>{label.action(entry.action)}</td>
                          <td className={td}>{target(entry)}</td>
                          <td className={td}>{dealership(entry)}</td>
                          <td className={td}>{source(entry)}</td>
                          <td className="px-3 py-2 pe-5 text-end">{toggleButton(entry)}</td>
                        </tr>
                        {on && (
                          <tr className="border-b border-border bg-muted/40">
                            <td colSpan={7} className="px-5 pb-4">
                              <EntryDetails id={`entry-${entry.id}`} entry={entry} described={describe(entry)} display={display} lookups={lookups} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {data.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-caption text-muted-foreground sm:px-5">
            <span>{t("pagination.showing", { from: n(from), to: n(to), total: n(data.total) })}</span>
            <Pager page={query.page} pages={data.pages} href={(page) => `${BASE}${platformActivityQueryString({ ...query, page })}`} />
          </div>
        )}
      </section>
    </div>
  );
}

/** One change in full: the sentence, each field before and after, the session, the device. */
function EntryDetails({
  id,
  entry,
  described,
  display,
  lookups,
}: {
  id: string;
  entry: PlatformActivityEntry;
  described: Described;
  display: ReturnType<typeof useActivityDisplay>;
  lookups: PlatformActivity["lookups"];
}) {
  const t = useTranslations("superAdmin.auditLogs");
  const fmt = useFormatters();
  const reason = display.reason(entry);
  const as = display.signedInAs(entry, lookups);
  const device = display.device(entry);

  return (
    <div id={id} className="flex flex-col gap-3 rounded-[14px] border border-border bg-card p-4 text-start text-caption">
      <p className="text-body text-muted-foreground">{described.sentence}</p>
      {reason && <p className="text-muted-foreground">{t("reason", { reason })}</p>}

      {described.changes.length > 0 && (
        <div className="overflow-hidden rounded-control border border-border">
          {/* On a phone the field names its own line, with before and after under it. */}
          <div className="grid grid-cols-2 bg-muted/60 text-micro font-semibold text-muted-foreground sm:grid-cols-[minmax(90px,160px)_1fr_1fr]">
            <span className="hidden px-3 py-2 sm:block">{t("change.field")}</span>
            <span className="px-3 py-2">{t("change.before")}</span>
            <span className="px-3 py-2">{t("change.after")}</span>
          </div>
          {described.changes.map((change) => (
            <div key={change.key} className="grid grid-cols-2 border-t border-border sm:grid-cols-[minmax(90px,160px)_1fr_1fr]">
              <span className="col-span-2 px-3 pt-2 font-semibold sm:col-span-1 sm:py-2">{change.label}</span>
              <span className="min-w-0 break-words px-3 py-2 text-[#a3341f] line-through decoration-[#c2452d]/60">
                {change.before ? <bdi>{change.before}</bdi> : <span className="text-muted-foreground no-underline">—</span>}
              </span>
              <span className="min-w-0 break-words px-3 py-2 font-semibold text-[#0e6b4c]">
                <bdi>{change.after}</bdi>
              </span>
            </div>
          ))}
        </div>
      )}

      {entry.source === "support" && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>{t.rich("session", { name: as ?? "—", b: (c) => <b className="font-semibold">{c}</b> })}</span>
          {entry.actorId && (
            <Link href={`/super-admin/impersonation?admin=${entry.actorId}`} className="font-semibold text-[#1d4e9e] underline-offset-2 hover:underline">
              {t("seeSessions")}
            </Link>
          )}
        </p>
      )}

      <p className="flex flex-wrap gap-x-5 gap-y-1 text-micro text-muted-foreground">
        <span>{t("recorded", { time: fmt.dateTime(entry.createdAt, { second: "2-digit" }) })}</span>
        {device && <span>{device}</span>}
        {entry.ip && (
          <span>
            {t("ip")}{" "}
            <bdi dir="ltr">{entry.ip}</bdi>
          </span>
        )}
      </p>
    </div>
  );
}
