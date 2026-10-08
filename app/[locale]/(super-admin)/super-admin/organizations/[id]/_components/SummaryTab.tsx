"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SectionPanel } from "@/components/dashboard/SectionPanel";
import { useFormatters } from "@/hooks/use-formatters";
import { formatPlanAmount } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { DealershipDetail } from "@/lib/services/super-admin/dealership-detail";
import { useDealershipDisplay } from "../../_components/use-dealership-display";
import { ActivityList } from "./ActivityList";
import { CarsTable } from "./RecordTabs";
import { PlanCard } from "./PlanCard";

type Summary = Extract<DealershipDetail, { summary: unknown }>;

/**
 * The dealership's summary tab: four numbers, its newest cars and latest
 * activity, and beside them its plan and contact details.
 */
export function SummaryTab({ data, base }: { data: Summary; base: string }) {
  const t = useTranslations("superAdmin.organizations.details");
  const fmt = useFormatters();
  const display = useDealershipDisplay();
  const n = (value: number) => fmt.number(value);
  const { counts, summary, dealership: org } = data;

  const numbers = [
    { label: t("kpis.carsOnSale"), value: n(counts.carsOnSale), note: t("kpis.carsNote", { total: n(counts.cars), hidden: n(counts.carsHidden) }) },
    { label: t("kpis.drives"), value: n(summary.drives.requested), note: t("kpis.drivesNote", { value: n(summary.drives.completed) }) },
    { label: t("kpis.questions"), value: n(summary.questions), note: null },
    {
      label: t("kpis.paid"),
      value: counts.paidCents > 0 ? formatPlanAmount(counts.paidCents, fmt.locale) : t("kpis.paidNone"),
      note: counts.payments > 0 ? t("kpis.paidNote", { count: counts.payments, value: n(counts.payments) }) : null,
    },
  ];
  const info: [string, React.ReactNode][] = [
    [t("info.owner"), org.owner ? org.owner.name || org.owner.email : null],
    [t("info.email"), org.email && <a href={`mailto:${org.email}`} className="text-[#1d4e9e] underline-offset-2 hover:underline" dir="ltr">{org.email}</a>],
    [t("info.phone"), org.phone && <bdi dir="ltr">{org.phone}</bdi>],
    [t("info.place"), display.place(org) || null],
    [t("info.address"), org.address],
    [t("info.rating"), org.rating ? t("info.ratingValue", { rating: fmt.number(org.rating.value, { maximumFractionDigits: 1 }), count: org.rating.count, value: n(org.rating.count) }) : t("info.noReviews")],
  ];

  return (
    <div className="flex flex-col gap-6">
      <dl aria-label={t("kpis.label")} className="grid grid-cols-2 overflow-hidden rounded-[20px] border border-border bg-card lg:grid-cols-4">
        {numbers.map((item, i) => (
          <div
            key={item.label}
            className={cn("flex flex-col gap-0.5 border-border p-4 sm:px-5", i % 2 === 1 && "border-s", i >= 2 && "border-t", "lg:border-t-0 lg:border-s lg:first:border-s-0")}
          >
            <dt className="text-caption text-muted-foreground">{item.label}</dt>
            <dd className="text-[1.6rem] font-extrabold leading-tight tabular-nums">{item.value}</dd>
            {item.note && <dd className="text-micro text-muted-foreground">{item.note}</dd>}
          </div>
        ))}
      </dl>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="newest-cars" className="overflow-hidden rounded-[20px] border border-border bg-card">
            <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
              <h2 id="newest-cars" className="text-[1.25rem] font-extrabold">{t("newestCars")}</h2>
              {counts.cars > 0 && (
                <Link href={`${base}?tab=cars`} className="text-caption font-semibold text-[#1d4e9e] underline-offset-2 hover:underline">
                  {t("allCars")}
                </Link>
              )}
            </header>
            {summary.cars.length === 0 ? (
              <p className="border-t border-border px-4 py-5 text-caption text-muted-foreground sm:px-5">{t("cars.empty")}</p>
            ) : (
              <CarsTable cars={summary.cars} interest={false} />
            )}
          </section>

          <section aria-labelledby="recent" className="overflow-hidden rounded-[20px] border border-border bg-card">
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
              <h2 id="recent" className="text-[1.25rem] font-extrabold">{t("recent")}</h2>
              <Link href={`${base}?tab=activity`} className="text-caption font-semibold text-[#1d4e9e] underline-offset-2 hover:underline">
                {t("allActivity")}
              </Link>
            </header>
            <ActivityList activity={summary.activity} dealershipName={org.name} />
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <PlanCard data={data} plans={data.plans} />
          <SectionPanel title={t("info.title")}>
            <dl className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-3 gap-y-2 text-caption">
              {info.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className={cn("min-w-0 break-words", !value && "text-muted-foreground")}>{value || t("info.notGiven")}</dd>
                </div>
              ))}
            </dl>
          </SectionPanel>
        </div>
      </div>
    </div>
  );
}
