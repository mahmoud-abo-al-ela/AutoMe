"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { cn } from "@/lib/utils";
import { AssistantQuality } from "./AssistantQuality";
import {
  Bars,
  Change,
  Panel,
  Stat,
  td,
  th,
  usePercent,
  type Of,
} from "./report-parts";

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
  const usd = (microUsd: number) =>
    fmt.number(microUsd / 1_000_000, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
          value={<span dir="ltr">{usd(data.costMicroUsd)}</span>}
          note={
            <span className="text-micro text-muted-foreground">
              {t("listPrice", { value: usd(data.listPrice.microUsd) })}
              {data.listPrice.unpricedCalls > 0 && ` · ${t("unpriced", { count: n(data.listPrice.unpricedCalls) })}`}
            </span>
          }
        />
      </div>

      <Panel title={t("features")}>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-caption">
            <thead>
              <tr className="whitespace-nowrap border-b border-border bg-muted/60 text-muted-foreground">
                {(["feature", "calls", "success", "tokensIn", "cached", "tokensOut"] as const).map((key) => (
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
                  {/* How much input the provider served from its prompt cache. */}
                  <td className={td}>{percent(row.cachedTokens, row.inputTokens)}</td>
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

      <AssistantQuality data={data.assistant} />
    </div>
  );
}
