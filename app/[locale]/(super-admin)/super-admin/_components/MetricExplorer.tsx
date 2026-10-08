"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useFormatters } from "@/hooks/use-formatters";
import { formatPlanAmount, minorToMajor } from "@/lib/utils/currency";
import { addDays } from "@/lib/utils/date-only";
import { cn } from "@/lib/utils";
import { OVERVIEW_METRICS, type OverviewMetric } from "@/lib/services/super-admin/overview-options";
import type { PlatformOverview } from "@/lib/services/super-admin/overview";

type Point = { date: string; previousDate: string; current: number; previous: number };

/**
 * The overview's five numbers as tabs (canvas: Super admin overview round 2,
 * "3 · Metric explorer"): each shows the period's total and how it moved
 * against the period before, in words; the chosen one draws its running
 * total day by day below, with the period before as a dashed line. One unit
 * on one axis — money in EGP, everything else a count.
 */
export function MetricExplorer({
  metrics,
  windows,
  compare,
}: {
  metrics: PlatformOverview["metrics"];
  windows: PlatformOverview["windows"];
  compare: boolean;
}) {
  const t = useTranslations("superAdmin.overview");
  const fmt = useFormatters();
  const [selected, setSelected] = useState<OverviewMetric>("revenue");
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const value = (metric: OverviewMetric, amount: number) =>
    metric === "revenue" ? formatPlanAmount(amount, fmt.locale) : fmt.number(amount);
  const day = (date: string) => fmt.date(`${date}T00:00:00Z`, { day: "numeric", month: "short", year: undefined, timeZone: "UTC" });

  // How a number moved against the period before, in words — never colour alone.
  const change = (now: number, before: number) => {
    if (before === 0) return now === 0 ? { text: t("change.same"), tone: "flat" } : { text: t("change.fromZero"), tone: "flat" };
    const ratio = (now - before) / before;
    const percent = fmt.number(Math.abs(ratio), { style: "percent", maximumFractionDigits: 1 });
    if (Math.abs(ratio) < 0.0005) return { text: t("change.same"), tone: "flat" };
    return ratio > 0 ? { text: t("change.up", { percent }), tone: "up" } : { text: t("change.down", { percent }), tone: "down" };
  };

  // Arrow keys move between the tabs, in reading order (so mirrored in Arabic).
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[event.key];
    const target =
      event.key === "Home" ? 0 : event.key === "End" ? OVERVIEW_METRICS.length - 1 : step === undefined ? null : (index + step + OVERVIEW_METRICS.length) % OVERVIEW_METRICS.length;
    if (target === null) return;
    event.preventDefault();
    setSelected(OVERVIEW_METRICS[target]);
    tabs.current[target]?.focus();
  };

  const series = metrics[selected];
  const points: Point[] = series.current.map((current, i) => ({
    date: addDays(windows.current.start, i),
    previousDate: addDays(windows.previous.start, i),
    current,
    previous: series.previousSeries[i],
  }));
  const axis = (amount: number) =>
    selected === "revenue" ? fmt.number(minorToMajor(amount), { notation: "compact" }) : fmt.number(amount);
  const label = t(compare ? "chart.label" : "chart.labelAlone", {
    metric: t(`metrics.${selected}`),
    value: value(selected, series.value),
    previous: value(selected, series.previous),
  });

  return (
    <section aria-label={t("metrics.label")} className="overflow-hidden rounded-[20px] border border-border bg-card">
      <div role="tablist" aria-label={t("metrics.label")} className="flex overflow-x-auto border-b border-border [scrollbar-width:none] lg:grid lg:grid-cols-5 [&::-webkit-scrollbar]:hidden">
        {OVERVIEW_METRICS.map((metric, i) => {
          const on = metric === selected;
          const moved = change(metrics[metric].value, metrics[metric].previous);
          return (
            <button
              key={metric}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`metric-${metric}`}
              aria-selected={on}
              aria-controls="metric-chart"
              tabIndex={on ? 0 : -1}
              onClick={() => setSelected(metric)}
              onKeyDown={(event) => onKeyDown(event, i)}
              className={cn(
                "relative flex min-w-[168px] shrink-0 flex-col gap-0.5 border-border px-4 pb-3.5 pt-4 text-start transition-colors sm:px-5 lg:min-w-0",
                "border-s first:border-s-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                on ? "bg-muted/50 shadow-[inset_0_-3px_0_var(--chart-1)]" : "hover:bg-muted/30",
              )}
            >
              <span className="text-caption text-muted-foreground">{t(`metrics.${metric}`)}</span>
              <span className="text-[1.5rem] font-extrabold leading-tight tabular-nums">{value(metric, metrics[metric].value)}</span>
              {compare && (
                <span
                  className={cn(
                    "text-micro font-semibold",
                    moved.tone === "up" ? "text-positive" : moved.tone === "down" ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {moved.text}
                  <span className="sr-only"> {t("change.compared")}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div id="metric-chart" role="tabpanel" aria-labelledby={`metric-${selected}`} className="px-2 pb-4 pt-4 sm:px-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-2 sm:px-0">
          <p className="text-caption text-muted-foreground">
            {t("chart.hint", { from: day(windows.current.start), to: day(windows.current.end) })}
          </p>
          {compare && (
            <ul className="flex gap-4 text-caption text-muted-foreground">
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-[3px] w-5 rounded-full bg-chart-1" />
                {t("chart.current")}
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="w-5 border-t-2 border-dashed border-muted-foreground" />
                {t("chart.previous")}
              </li>
            </ul>
          )}
        </div>
        <div role="img" aria-label={label} className="h-[240px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="metric-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={48} tickFormatter={day} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} allowDecimals={false} tickFormatter={axis} />
              <Tooltip
                cursor={{ stroke: "var(--foreground)", strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  const point = active ? (payload?.[0]?.payload as Point | undefined) : undefined;
                  if (!point) return null;
                  return (
                    <div className="rounded-control bg-inverse px-3 py-2 text-caption text-inverse-foreground shadow-lg">
                      <p className="font-semibold">
                        {day(point.date)}: <span className="tabular-nums">{value(selected, point.current)}</span>
                      </p>
                      {compare && (
                        <p className="opacity-80">
                          {day(point.previousDate)}: <span className="tabular-nums">{value(selected, point.previous)}</span>
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              {compare && (
                <Line dataKey="previous" type="monotone" stroke="var(--muted-foreground)" strokeWidth={2} strokeDasharray="6 5" dot={false} activeDot={false} isAnimationActive={false} />
              )}
              <Area
                dataKey="current"
                type="monotone"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                fill="url(#metric-fill)"
                activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
