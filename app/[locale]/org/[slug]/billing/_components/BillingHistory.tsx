"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { getBillingHistory } from "@/actions/billing";
import { SectionPanel } from "../../_components/SectionPanel";

/** One audit-log-derived row of the plan history, as the action returns it. */
type BillingHistoryEntry = Extract<Awaited<ReturnType<typeof getBillingHistory>>, { success: true }>["data"]["history"][number];

/**
 * When the plan changed — created, upgraded, moved down, ended, renewed — and
 * who did it. The server's own description is left out: it is English-only,
 * and the event's translated name already says what happened.
 */
export default function BillingHistory({ organizationId }: { organizationId: string }) {
  const t = useTranslations("org.billing.history");
  const { dateTime } = useFormatters();
  const [history, setHistory] = useState<BillingHistoryEntry[] | null>(null);
  // A flag, not the server's message: that arrives in English, and the reader
  // is told the same translated thing whatever the cause.
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getBillingHistory(organizationId)
      .then((result) => (result.success ? setHistory(result.data.history || []) : setFailed(true)))
      .catch(() => setFailed(true));
  }, [organizationId]);

  // The audit action is the message key. An action with no message falls back
  // to the raw enum rather than rendering blank — it is at least identifiable.
  const label = (action: string) => (t.has(`events.${action}`) ? t(`events.${action}`) : action);

  return (
    <SectionPanel title={t("title")}>
      {failed ? (
        <p role="alert" className="text-caption">{t("loadFailed")}</p>
      ) : history === null ? (
        <ul aria-busy className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <li key={i} className="flex flex-col gap-1.5">
              <span className="skeleton-shimmer h-4 w-1/3 rounded" />
              <span className="skeleton-shimmer h-3 w-1/2 rounded" />
            </li>
          ))}
        </ul>
      ) : history.length === 0 ? (
        <p className="text-caption text-muted-foreground">{t("emptyTitle")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {history.map((event) => (
            <li key={event.id} className="grid gap-x-4 gap-y-0.5 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto]">
              <span className="font-semibold">{label(event.action)}</span>
              <span className="text-caption text-muted-foreground sm:text-end">{dateTime(event.date)}</span>
              {event.actor && <span className="text-micro text-muted-foreground sm:col-span-2">{t("byWho", { name: event.actor })}</span>}
            </li>
          ))}
        </ul>
      )}
    </SectionPanel>
  );
}
