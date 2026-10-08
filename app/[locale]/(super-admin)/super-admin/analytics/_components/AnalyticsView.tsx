"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { OrgPageHeader } from "@/components/dashboard/OrgPageHeader";
import { cn } from "@/lib/utils";
import { ANALYTICS_PERIODS, ANALYTICS_REPORTS, analyticsQueryString, type AnalyticsQuery } from "@/lib/services/super-admin/analytics-options";
import type { Analytics } from "@/lib/services/super-admin/analytics";
import { useTabSwitch } from "../../_components/use-tab-switch";
import { ReportSkeleton } from "./ReportSkeletons";
import { AiReport, BuyersReport, DealershipsReport, MarketplaceReport } from "./Reports";

const BASE = "/super-admin/analytics";

/**
 * The super-admin Analytics page (canvas: Super admin analytics round 1, "1 ·
 * Report tabs"): a period, four reports as tabs, and the open report. Both
 * live in the URL; while the next report or period loads, that report's own
 * skeleton stands in.
 */
export function AnalyticsView({ analytics }: { analytics: Analytics }) {
  const t = useTranslations("superAdmin.analytics");
  const router = useRouter();
  const [periodLoading, startTransition] = useTransition();
  const { query, data } = analytics;
  const tabs = useTabSwitch(query.report);
  const href = (change: Partial<AnalyticsQuery>) => `${BASE}${analyticsQueryString({ ...query, ...change })}`;

  return (
    <div className="flex flex-col gap-5">
      <OrgPageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <div role="group" aria-label={t("periods.label")} className="flex h-11 overflow-hidden rounded-control border border-[#8c8170] bg-field">
            {ANALYTICS_PERIODS.map((days) => {
              const on = days === query.days;
              return (
                <button
                  key={days}
                  type="button"
                  aria-pressed={on}
                  onClick={() => !on && startTransition(() => router.replace(href({ days }), { scroll: false }))}
                  className={cn(
                    "cursor-pointer whitespace-nowrap px-3 text-caption focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-3.5",
                    on ? "bg-inverse font-semibold text-inverse-foreground" : "text-foreground hover:bg-muted",
                  )}
                >
                  {t(`periods.${days}`)}
                </button>
              );
            })}
          </div>
        }
        className="mb-0 md:mb-0"
      />

      <nav aria-label={t("reports.label")} className="-mx-4 -mb-1 flex gap-1 overflow-x-auto border-b border-border px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {ANALYTICS_REPORTS.map((report) => {
          const on = report === tabs.shown;
          return (
            <Link
              key={report}
              href={href({ report })}
              scroll={false}
              aria-current={on ? "page" : undefined}
              onClick={tabs.open(report, href({ report }))}
              className={cn(
                "flex h-11 shrink-0 items-center px-3 text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                on ? "font-semibold text-foreground shadow-[inset_0_-3px_0_var(--foreground)]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`reports.${report}`)}
            </Link>
          );
        })}
      </nav>

      {tabs.loading || periodLoading ? (
        <ReportSkeleton report={tabs.shown} />
      ) : (
        <>
          {data.report === "marketplace" && <MarketplaceReport data={data} days={query.days} />}
          {data.report === "dealerships" && <DealershipsReport data={data} />}
          {data.report === "buyers" && <BuyersReport data={data} />}
          {data.report === "ai" && <AiReport data={data} />}
        </>
      )}
    </div>
  );
}
