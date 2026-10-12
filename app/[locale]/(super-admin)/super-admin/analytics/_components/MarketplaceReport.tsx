"use client";

import { useTranslations } from "next-intl";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import { useFormatters } from "@/hooks/use-formatters";
import { STALE_AFTER_DAYS, type AnalyticsPeriod } from "@/lib/services/super-admin/analytics-options";
import {
  Bars,
  Change,
  Panel,
  usePercent,
  type Of,
} from "./report-parts";

/** Listing to sale, what's for sale at what price, what buyers want, and how fast cars sell. */
export function MarketplaceReport({ data, days }: { data: Of<"marketplace">; days: AnalyticsPeriod }) {
  const t = useTranslations("superAdmin.analytics");
  const fmt = useFormatters();
  const attrs = useCarAttributes();
  const percent = usePercent();
  const n = (value: number) => fmt.number(value);

  const steps = [
    { key: "carsLive", value: data.carsLive, note: <span className="text-micro text-muted-foreground">{t("funnel.listed", { count: data.listed.current, value: n(data.listed.current) })}</span> },
    { key: "saves", value: data.saves.current, note: <Change pair={data.saves} /> },
    { key: "asked", value: data.asked.current, note: <Change pair={data.asked} /> },
    { key: "confirmed", value: data.confirmed.current, note: <span className="text-micro text-muted-foreground">{t("funnel.ofAsked", { value: percent(data.confirmed.current, data.asked.current) })}</span> },
    { key: "driven", value: data.driven.current, note: <span className="text-micro text-muted-foreground">{t("funnel.ofConfirmed", { value: percent(data.driven.current, data.confirmed.current) })}</span> },
    { key: "sold", value: data.sold.current, note: <Change pair={data.sold} /> },
  ];
  const widest = Math.max(1, ...steps.map((step) => step.value));
  const days2sell = data.daysToSell;
  const dayText = (value: number) => t("speed.days", { count: Math.round(value), value: n(Math.round(value)) });

  return (
    <div className="flex flex-col gap-5">
      <Panel title={t("funnel.title")} note={t("funnel.note", { before: t(`before.${days}`) })}>
        <ol className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 xl:grid-cols-6">
          {steps.map((step) => (
            <li key={step.key} className="flex min-w-0 flex-col gap-1.5 bg-card px-5 py-4">
              <span className="text-caption text-muted-foreground">{t(`funnel.${step.key}`)}</span>
              <span className="text-[1.75rem] font-bold leading-tight tracking-tight tabular-nums">{n(step.value)}</span>
              <span className="min-h-5">{step.note}</span>
              <span aria-hidden className="mt-1 h-2.5 rounded-e bg-muted">
                <span className="block h-full rounded-e bg-[#1d4e9e]" style={{ width: `${Math.max(2, (step.value / widest) * 100)}%` }} />
              </span>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title={t("prices.title")} note={t("prices.note")}>
          <Bars rows={data.priceBands.map((band) => ({ key: band.key, label: t(`prices.${band.key}`), value: band.count }))} empty={t("makes.empty")} />
        </Panel>
        <Panel title={t("makes.title")} note={t("makes.note")}>
          <Bars rows={data.makes.map((make) => ({ key: make.key, label: <bdi>{attrs.make(make.key)}</bdi>, value: make.count }))} empty={t("makes.empty")} />
        </Panel>
        <Panel title={t("speed.title")}>
          <dl className="flex flex-col divide-y divide-border">
            <div className="flex flex-col gap-1 px-5 py-4">
              <dt className="text-caption text-muted-foreground">{t("speed.daysToSell")}</dt>
              <dd className="text-xl font-bold tabular-nums">{days2sell.current === null ? "—" : dayText(days2sell.current)}</dd>
              <dd className="text-micro text-muted-foreground">
                {days2sell.current === null
                  ? t("speed.noSales")
                  : days2sell.previous !== null && Math.round(days2sell.previous) !== Math.round(days2sell.current)
                    ? t(days2sell.current < days2sell.previous ? "speed.faster" : "speed.slower", {
                        value: dayText(Math.abs(days2sell.previous - days2sell.current)),
                      })
                    : null}
              </dd>
            </div>
            <div className="flex flex-col gap-1 px-5 py-4">
              <dt className="text-caption text-muted-foreground">{t("speed.unsaved", { days: n(STALE_AFTER_DAYS) })}</dt>
              <dd className="text-xl font-bold tabular-nums">{n(data.unsaved)}</dd>
              <dd className="text-micro text-muted-foreground">{t("speed.unsavedShare", { value: percent(data.unsaved, data.carsLive) })}</dd>
            </div>
            <div className="flex flex-col gap-1 px-5 py-4">
              <dt className="text-caption text-muted-foreground">{t("speed.cancelled")}</dt>
              <dd className="text-xl font-bold tabular-nums">{percent(data.cancelled.current, data.asked.current)}</dd>
              <dd className="text-micro text-muted-foreground">{t("speed.cancelledOf", { count: n(data.cancelled.current), total: n(data.asked.current) })}</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </div>
  );
}
