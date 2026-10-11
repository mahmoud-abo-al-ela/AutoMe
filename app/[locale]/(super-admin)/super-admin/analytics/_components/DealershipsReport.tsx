"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { planKeyFor } from "@/lib/constants/plans";
import { useFormatters } from "@/hooks/use-formatters";
import { findGovernorate } from "@/lib/locations/data";
import { cn } from "@/lib/utils";
import {
  Bars,
  Change,
  Panel,
  Stat,
  link,
  td,
  th,
  type Of,
} from "./report-parts";

function useRegionName() {
  const locale = useLocale();
  const t = useTranslations("superAdmin.analytics.dealerships");
  return (code: string | null) => {
    const found = code ? findGovernorate(code) : undefined;
    return found ? (locale === "ar" ? found.ar : found.en) : t("noRegion");
  };
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
