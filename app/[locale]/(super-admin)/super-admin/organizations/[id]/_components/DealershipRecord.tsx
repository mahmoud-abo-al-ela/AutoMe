"use client";

import { useTranslations } from "next-intl";
import { CircleAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { useFormatters } from "@/hooks/use-formatters";
import { formatPlanAmount } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { DEALERSHIP_TABS } from "@/lib/services/super-admin/dealerships-options";
import type { DealershipDetail } from "@/lib/services/super-admin/dealership-detail";
import { DealershipHeader } from "./DealershipHeader";
import { ActivityTab, BillingTab, CarsTab, TeamTab } from "./RecordTabs";
import { SummaryTab } from "./SummaryTab";
import { DealershipTabSkeleton } from "./TabSkeletons";
import { useTabSwitch } from "../../../_components/use-tab-switch";

/** Where the dealership stands, when it needs saying: overdue, on a trial, or suspended. */
function StandingAlert({ data, base }: { data: DealershipDetail; base: string }) {
  const t = useTranslations("superAdmin.organizations.details.alert");
  const tPlans = useTranslations("plans");
  const fmt = useFormatters();
  const { dealership: org, subscription: sub, lastFailure } = data;
  const day = (iso: string) => fmt.date(iso, { year: undefined });
  const longDay = (date: string) => fmt.date(`${date}T00:00:00Z`, { month: "long", year: undefined, timeZone: "UTC" });

  let tone: "due" | "trial" | "off" | null = null;
  let text: React.ReactNode = null;
  if (!org.isActive) {
    tone = "off";
    text = t("suspended");
  } else if (sub?.status === "PAST_DUE") {
    tone = "due";
    text = (
      <>
        <b className="font-semibold">
          {lastFailure
            ? t("overdueFailed", { amount: formatPlanAmount(lastFailure.amountCents, fmt.locale), date: day(lastFailure.createdAt) })
            : t("overdueTitle", { date: sub.pastDueSince ? day(sub.pastDueSince) : "" })}
        </b>{" "}
        {sub.dropsOn ? t("overdueDrops", { name: org.name, date: longDay(sub.dropsOn) }) : t("overdueDropsSoon", { name: org.name })}
      </>
    );
  } else if (sub?.status === "TRIALING" && sub.trialEndsAt) {
    const key = planKeyFor(sub.plan.type);
    tone = "trial";
    text = t("trial", { plan: key ? tPlans(`plans.${key}.name`) : sub.plan.name, date: day(sub.trialEndsAt) });
  }
  if (!tone) return null;

  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-[16px] border px-4 py-3 text-body sm:px-5",
        tone === "due" && "border-destructive/30 bg-destructive-soft text-destructive",
        tone === "trial" && "border-[#e0c46b] bg-[#fff1c2] text-[#5e3f00]",
        tone === "off" && "border-border bg-muted text-foreground",
      )}
    >
      <CircleAlert aria-hidden className="size-5 shrink-0" />
      <p className="min-w-0 flex-1">{text}</p>
      {tone === "due" && data.tab !== "billing" && (
        <Link href={`${base}?tab=billing`} className="font-semibold underline underline-offset-2">
          {t("seeBilling")}
        </Link>
      )}
    </div>
  );
}

/**
 * One dealership (canvas: Super admin dealership detail round 1, "1 · Record
 * with tabs"): who it is and its actions, its standing when that needs saying,
 * then tabs — Summary, Cars, Team, Billing, Activity — each in the URL.
 */
export function DealershipRecord({ data }: { data: DealershipDetail }) {
  const t = useTranslations("superAdmin.organizations.details");
  const fmt = useFormatters();
  const base = `/super-admin/organizations/${data.dealership.id}`;
  const counts: Partial<Record<(typeof DEALERSHIP_TABS)[number], number>> = { cars: data.counts.cars, team: data.counts.team };
  const tabs = useTabSwitch(data.tab);

  return (
    <div className="flex flex-col gap-5">
      <DealershipHeader data={data} />

      <nav aria-label={t("tabs.label")} className="flex gap-1 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {DEALERSHIP_TABS.map((tab) => {
          const on = tab === tabs.shown;
          const href = tab === "summary" ? base : `${base}?tab=${tab}`;
          return (
            <Link
              key={tab}
              href={href}
              scroll={false}
              onClick={tabs.open(tab, href)}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex h-11 shrink-0 items-center gap-2 px-3.5 text-body transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                on ? "font-semibold text-foreground shadow-[inset_0_-3px_0_var(--foreground)]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`tabs.${tab}`)}
              {counts[tab] !== undefined && (
                <span className="rounded-full bg-muted px-2 text-micro font-semibold leading-5 text-foreground tabular-nums">{fmt.number(counts[tab]!)}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <StandingAlert data={data} base={base} />

      {/* Switching tabs shows the next tab's own skeleton until it arrives. */}
      {tabs.loading ? (
        <DealershipTabSkeleton tab={tabs.shown} />
      ) : (
        <>
          {"summary" in data && <SummaryTab data={data} base={base} />}
          {"cars" in data && <CarsTab data={data} base={base} />}
          {"team" in data && <TeamTab data={data} />}
          {"payments" in data && <BillingTab data={data} />}
          {"activity" in data && <ActivityTab data={data} base={base} />}
        </>
      )}
    </div>
  );
}
