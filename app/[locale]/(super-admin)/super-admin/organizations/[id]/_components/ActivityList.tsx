"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { useDescribeEntry } from "@/components/dashboard/use-describe-entry";
import { cn } from "@/lib/utils";
import type { Activity } from "@/lib/services/audit/activity";

/** A dot's colour by what kind of thing changed: money, buyers, staff, or the rest. */
function tone(entry: Activity["entries"][number]) {
  if (entry.bySupport || entry.action.startsWith("IMPERSONATION")) return "bg-chart-1";
  if (entry.entityType === "SUBSCRIPTION") return entry.action.includes("FAIL") || entry.action.includes("PAST_DUE") ? "bg-destructive" : "bg-chart-1";
  if (entry.entityType === "TEST_DRIVE") return "bg-positive";
  return "bg-[#8c8170]";
}

/**
 * A dealership's activity as sentences — the same wording as the dealer's own
 * Activity page — newest first, each with when it happened. Car names stay
 * plain text: the super-admin has no car editor.
 */
export function ActivityList({ activity, dealershipName }: { activity: Activity; dealershipName: string }) {
  const t = useTranslations("superAdmin.organizations.details");
  const fmt = useFormatters();
  const describe = useDescribeEntry(activity.lookups, dealershipName);

  if (activity.entries.length === 0) {
    return <p className="px-4 py-5 text-caption text-muted-foreground sm:px-5">{t("activityEmpty")}</p>;
  }

  return (
    <ul className="flex flex-col">
      {activity.entries.map((entry) => {
        const { sentence } = describe(entry);
        return (
          <li key={entry.id} className="flex gap-3 border-t border-border px-4 py-3 first:border-t-0 sm:px-5">
            <span aria-hidden className={cn("mt-2 size-2 shrink-0 rounded-full", tone(entry))} />
            <div className="min-w-0">
              <p className="text-caption text-muted-foreground">{sentence}</p>
              <p className="text-micro text-muted-foreground">{fmt.dateTime(entry.createdAt, { year: undefined })}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
