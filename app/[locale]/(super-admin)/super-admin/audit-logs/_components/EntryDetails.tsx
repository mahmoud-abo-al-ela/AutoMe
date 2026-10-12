"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Described } from "@/components/dashboard/use-describe-entry";
import { useFormatters } from "@/hooks/use-formatters";
import type { PlatformActivity, PlatformActivityEntry } from "@/lib/services/super-admin/platform-activity";
import type { useActivityDisplay } from "./use-activity-display";

/** One change in full: the sentence, each field before and after, the session, the device. */
export function EntryDetails({
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
