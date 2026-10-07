"use client";

import { useTranslations } from "next-intl";
import { BarChart3 } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useFormatters } from "@/hooks/use-formatters";
import { Panel, PanelEmpty } from "./Panel";

export type DrivesPoint = { date: string; requested: number; completed: number };

/**
 * Test drives per day for the last 30 days: how many were requested and how
 * many of those were completed — one unit, one axis, so the two lines can be
 * read against each other (the stacked area this replaces summed unlike
 * things). Colours are the validated chart tokens (globals.css, work mode),
 * named in a legend beside the title; hovering a day shows both values.
 */
export function DrivesChart({ data, emptyLabel }: { data: DrivesPoint[]; /** What an empty period says; the overview's 30 days by default. */ emptyLabel?: string }) {
  const t = useTranslations("org.dashboard.today.chart");
  const { date, number } = useFormatters();
  const day = (value: string | number | Date) => date(value, { day: "numeric", month: "short", year: undefined });

  const config = {
    requested: { label: t("requested"), color: "var(--chart-1)" },
    completed: { label: t("completed"), color: "var(--chart-2)" },
  };
  const empty = data.every((point) => point.requested === 0);

  return (
    <Panel
      title={t("title")}
      actions={
        <ul className="flex gap-5 text-caption">
          {(["requested", "completed"] as const).map((key) => (
            <li key={key} className="flex items-center gap-2">
              <span aria-hidden className="h-[3px] w-5 rounded-full" style={{ background: config[key].color }} />
              {config[key].label}
            </li>
          ))}
        </ul>
      }
      bodyClassName="px-2 sm:px-6"
    >
      {empty ? (
        <PanelEmpty icon={BarChart3} title={emptyLabel ?? t("empty")} />
      ) : (
        <ChartContainer config={config} className="aspect-auto h-[220px] w-full sm:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={40}
                tickFormatter={(value) => day(value)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={32}
                allowDecimals={false}
                tickFormatter={(value: number) => number(value)}
              />
              <ChartTooltip
                cursor={{ stroke: "var(--foreground)", strokeDasharray: "3 3" }}
                content={<ChartTooltipContent labelFormatter={(value) => day(value)} indicator="line" />}
              />
              <Line dataKey="requested" type="monotone" stroke="var(--color-requested)" strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }} />
              <Line dataKey="completed" type="monotone" stroke="var(--color-completed)" strokeWidth={2} dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}
    </Panel>
  );
}
