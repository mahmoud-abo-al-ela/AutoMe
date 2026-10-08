"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import { useCarAttributes } from "@/hooks/use-car-attributes";
import { useFormatters } from "@/hooks/use-formatters";
import { findGovernorate } from "@/lib/locations/data";
import { cn } from "@/lib/utils";
import { STALE_AFTER_DAYS, type AnalyticsPeriod } from "@/lib/services/super-admin/analytics-options";
import type { AnalyticsData } from "@/lib/services/super-admin/analytics";
import { Bars, Change, Panel, Stat } from "./report-parts";

type Of<R extends AnalyticsData["report"]> = Extract<AnalyticsData, { report: R }>;

const th = "px-3 py-3 text-center font-semibold first:ps-5 first:text-start";
const td = "px-3 py-3 text-center tabular-nums first:ps-5 first:text-start";
const link = "font-semibold text-[#1d4e9e] underline-offset-2 hover:underline";

function usePercent() {
  const fmt = useFormatters();
  return (part: number, whole: number) => (whole > 0 ? fmt.number(part / whole, { style: "percent", maximumFractionDigits: 0 }) : "—");
}

function useRegionName() {
  const locale = useLocale();
  const t = useTranslations("superAdmin.analytics.dealerships");
  return (code: string | null) => {
    const found = code ? findGovernorate(code) : undefined;
    return found ? (locale === "ar" ? found.ar : found.en) : t("noRegion");
  };
}

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

/** How many dealerships, on which plans, where, and which are busiest. */
export function DealershipsReport({ data }: { data: Of<"dealerships"> }) {
  const t = useTranslations("superAdmin.analytics.dealerships");
  const tPlans = useTranslations("plans");
  const fmt = useFormatters();
  const region = useRegionName();
  const n = (value: number) => fmt.number(value);
  const planName = (plan: { type: string; name: string } | null) => {
    if (!plan) return t("noPlan");
    const key = planKeyFor(plan.type);
    return key ? tPlans(`plans.${key}.name`) : plan.name;
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("active")} value={n(data.active)} />
        <Stat label={t("joined")} value={n(data.joined.current)} note={<Change pair={data.joined} />} />
        <Stat label={t("suspended")} value={n(data.suspended)} />
        <Stat label={t("withoutCars")} value={n(data.withoutCars)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={t("plans")}>
          <Bars rows={data.plans.map((row) => ({ key: row.plan?.id ?? "none", label: planName(row.plan), value: row.count }))} empty={t("empty")} />
        </Panel>
        <Panel title={t("regions")}>
          <Bars rows={data.regions.map((row) => ({ key: row.region ?? "none", label: region(row.region), value: row.count }))} empty={t("empty")} />
        </Panel>
      </div>

      <Panel title={t("busiest")} note={t("busiestNote")}>
        {data.busiest.length === 0 ? (
          <p className="px-5 py-8 text-center text-caption text-muted-foreground">{t("empty")}</p>
        ) : (
          <>
            <ul className="flex flex-col lg:hidden">
              {data.busiest.map((d) => (
                <li key={d.id} className="flex flex-col gap-1.5 border-b border-border px-4 py-3 last:border-b-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <Link href={`/super-admin/organizations/${d.id}`} className={link}>
                      <bdi>{d.name}</bdi>
                    </Link>
                    <span className="shrink-0 text-micro text-muted-foreground">{region(d.region)}</span>
                  </div>
                  <dl className="grid grid-cols-4 gap-2 text-micro">
                    {(["carsLive", "testDrives", "driven", "sold"] as const).map((key) => (
                      <div key={key} className="flex flex-col">
                        <dt className="text-muted-foreground">{t(`columns.${key}`)}</dt>
                        <dd className="font-semibold tabular-nums">{n(d[key])}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
            <div className="relative hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-caption">
                <thead>
                  <tr className="whitespace-nowrap border-b border-border bg-muted/60 text-muted-foreground">
                    {(["dealership", "governorate", "carsLive", "testDrives", "driven", "sold"] as const).map((key) => (
                      <th key={key} scope="col" className={cn(th, key === "sold" && "pe-5")}>
                        {t(`columns.${key}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.busiest.map((d) => (
                    <tr key={d.id} className="border-b border-border last:border-b-0">
                      <td className={td}>
                        <Link href={`/super-admin/organizations/${d.id}`} className={link}>
                          <bdi>{d.name}</bdi>
                        </Link>
                      </td>
                      <td className={cn(td, "text-muted-foreground")}>{region(d.region)}</td>
                      <td className={td}>{n(d.carsLive)}</td>
                      <td className={cn(td, "font-semibold")}>{n(d.testDrives)}</td>
                      <td className={td}>{n(d.driven)}</td>
                      <td className={cn(td, "pe-5")}>{n(d.sold)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}

/** New buyers, what they did, the cars they saved most, and the body types they want. */
export function BuyersReport({ data }: { data: Of<"buyers"> }) {
  const t = useTranslations("superAdmin.analytics.buyers");
  const fmt = useFormatters();
  const attrs = useCarAttributes();
  const n = (value: number) => fmt.number(value);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("joined")} value={n(data.joined.current)} note={<Change pair={data.joined} />} />
        <Stat label={t("saved")} value={n(data.saved.current)} note={<Change pair={data.saved} />} />
        <Stat label={t("askedToDrive")} value={n(data.askedToDrive.current)} note={<Change pair={data.askedToDrive} />} />
        <Stat label={t("askedAgain")} value={n(data.askedAgain.current)} note={<Change pair={data.askedAgain} />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={t("mostSaved")} note={t("mostSavedNote")}>
          {data.mostSaved.length === 0 ? (
            <p className="px-5 py-8 text-center text-caption text-muted-foreground">{t("empty")}</p>
          ) : (
            <ol className="flex flex-col">
              {data.mostSaved.map((car, i) => (
                <li key={car.id} className="flex items-center gap-3 border-b border-border px-5 py-3 text-caption last:border-b-0">
                  <span className="w-5 shrink-0 text-muted-foreground tabular-nums">{n(i + 1)}</span>
                  <span className="min-w-0 flex-1">
                    {/* A car's name stays Latin, its year included, as everywhere else. */}
                    <span className="block truncate font-semibold">
                      <bdi dir="ltr">{`${car.make} ${car.model} ${car.year}`}</bdi>
                    </span>
                    <span className="block truncate text-micro text-muted-foreground">
                      <Link href={`/super-admin/organizations/${car.organization.id}`} className="underline-offset-2 hover:text-[#1d4e9e] hover:underline">
                        <bdi>{car.organization.name}</bdi>
                      </Link>
                      {" · "}
                      {fmt.price(car.price)}
                    </span>
                  </span>
                  {/* The panel's note says what the number counts; the sentence is for screen readers. */}
                  <span className="relative shrink-0 text-body font-bold tabular-nums">
                    <span aria-hidden>{n(car.saves)}</span>
                    <span className="sr-only">{t("saves", { count: car.saves, value: n(car.saves) })}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel title={t("bodyTypes")} note={t("bodyTypesNote")}>
          <Bars rows={data.bodyTypes.map((row) => ({ key: row.key, label: attrs.body(row.key), value: row.count }))} empty={t("empty")} />
        </Panel>
      </div>
    </div>
  );
}

/** How much AI is used, how well it works, how long it takes, and what it costs. */
export function AiReport({ data }: { data: Of<"ai"> }) {
  const t = useTranslations("superAdmin.analytics.ai");
  const fmt = useFormatters();
  const percent = usePercent();
  const n = (value: number) => fmt.number(value);
  const wait = (ms: number | null) =>
    ms === null
      ? "—"
      : ms >= 1000
        ? fmt.number(ms / 1000, { style: "unit", unit: "second", unitDisplay: "narrow", maximumFractionDigits: 1 })
        : fmt.number(ms, { style: "unit", unit: "millisecond", unitDisplay: "narrow" });
  const feature = (name: string) => (t.has(`names.${name}`) ? t(`names.${name}`) : name);

  if (data.calls.current === 0) {
    return <p className="rounded-[20px] border border-border bg-card px-6 py-16 text-center text-caption text-muted-foreground">{t("empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("calls")} value={n(data.calls.current)} note={<Change pair={data.calls} />} />
        <Stat
          label={t("succeeded")}
          value={percent(data.calls.current - data.failed, data.calls.current)}
          note={<span className="text-micro text-muted-foreground">{t("failedOf", { count: n(data.failed) })}</span>}
        />
        <Stat
          label={t("wait")}
          value={wait(data.latency.p50)}
          note={<span className="text-micro text-muted-foreground">{t("slowest", { value: wait(data.latency.p95) })}</span>}
        />
        <Stat
          label={t("cost")}
          value={<span dir="ltr">{fmt.number(data.costMicroUsd / 1_000_000, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>}
        />
      </div>

      <Panel title={t("features")}>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-caption">
            <thead>
              <tr className="whitespace-nowrap border-b border-border bg-muted/60 text-muted-foreground">
                {(["feature", "calls", "success", "tokensIn", "tokensOut"] as const).map((key) => (
                  <th key={key} scope="col" className={cn(th, key === "tokensOut" && "pe-5")}>
                    {t(`columns.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.features.map((row) => (
                <tr key={row.feature} className="border-b border-border last:border-b-0">
                  <td className={cn(td, "font-semibold")}>{feature(row.feature)}</td>
                  <td className={td}>{n(row.calls)}</td>
                  <td className={td}>{percent(row.calls - row.failures, row.calls)}</td>
                  <td className={td}>{n(row.inputTokens)}</td>
                  <td className={cn(td, "pe-5")}>{n(row.outputTokens)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={t("models")}>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-caption">
              <thead>
                <tr className="whitespace-nowrap border-b border-border bg-muted/60 text-muted-foreground">
                  {(["model", "calls", "success", "typical", "slowest"] as const).map((key) => (
                    <th key={key} scope="col" className={cn(th, key === "slowest" && "pe-5")}>
                      {t(`columns.${key}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.models.map((row) => (
                  <tr key={row.model} className="border-b border-border last:border-b-0">
                    <td className={td}>
                      <bdi dir="ltr" className="font-mono text-micro">
                        {row.model}
                      </bdi>
                    </td>
                    <td className={td}>{n(row.calls)}</td>
                    <td className={td}>{percent(row.calls - row.failures, row.calls)}</td>
                    <td className={td}>{wait(row.p50LatencyMs)}</td>
                    <td className={cn(td, "pe-5")}>{wait(row.p95LatencyMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title={t("failures")}>
          <Bars
            rows={data.failures.map((row) => ({ key: row.errorCode, label: <bdi dir="ltr" className="font-mono text-micro">{row.errorCode}</bdi>, value: row.count }))}
            empty={t("noFailures")}
          />
        </Panel>
      </div>
    </div>
  );
}
