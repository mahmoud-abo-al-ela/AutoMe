"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ArrowRightCircle, Ban } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ConversionFunnelData } from "./AnalyticsCards";

/** Tailwind classes for one funnel stage, split by where they are applied. */
type StageColors = { text: string; track: string; bg: string };

const FunnelStage = ({
  title,
  count,
  percentage,
  share,
  colorClass,
  isLast,
  icon: Icon,
}: {
  title: string;
  /** Already formatted — see the numerals note in lib/utils/intl-locale. */
  count: string;
  /** 0-100, for the progress bar only; null means a full bar. */
  percentage: number | null;
  /** The translated "(12.5% of total)" aside, or null when there is none. */
  share: string | null;
  colorClass: StageColors;
  isLast?: boolean;
  icon: LucideIcon;
}) => (
  <div className="relative group">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <Icon className={`h-5 w-5 ${colorClass.text}`} />
        <span className="font-medium">{title}</span>
      </div>
      <div className="text-end">
        <span className="text-xl font-bold">{count}</span>
        {share && (
          <span className="text-sm text-muted-foreground ms-2 hidden sm:inline-block">
            {share}
          </span>
        )}
      </div>
    </div>
    
    <Progress 
      value={percentage !== null ? percentage : 100} 
      className={`h-3 ${colorClass.track}`}
      indicatorClassName={colorClass.bg}
    />
    
    {!isLast && (
      <div className="absolute -bottom-6 start-6 h-6 border-s-2 border-dashed border-border" />
    )}
  </div>
);

const ConversionFunnel = ({ funnel }: { funnel: ConversionFunnelData | null }) => {
  const t = useTranslations("org.dashboard");
  const { number } = useFormatters();

  const percent = (value: number) =>
    number(value / 100, { style: "percent", maximumFractionDigits: 1 });

  if (!funnel) return null;

  // Colors for each stage
  const stages = [
    {
      title: t("funnel.total"),
      count: number(funnel.total),
      percentage: 100,
      share: null,
      icon: ArrowRightCircle,
      color: { bg: "bg-blue-500", text: "text-blue-500", track: "bg-blue-100 dark:bg-blue-950" }
    },
    {
      title: t("funnel.confirmed"),
      count: number(funnel.confirmed),
      percentage: funnel.confirmedRate,
      share: t("funnel.shareOfTotal", { percent: percent(funnel.confirmedRate) }),
      icon: CheckCircle2,
      color: { bg: "bg-emerald-500", text: "text-emerald-500", track: "bg-emerald-100 dark:bg-emerald-950" }
    },
    {
      title: t("funnel.completed"),
      count: number(funnel.completed),
      percentage: funnel.completedRate,
      share: t("funnel.shareOfConfirmed", { percent: percent(funnel.completedRate) }),
      icon: CheckCircle2,
      color: { bg: "bg-green-600", text: "text-green-600", track: "bg-green-100 dark:bg-green-950" }
    }
  ];

  const cancelledRate = funnel.total > 0 ? (funnel.cancelled / funnel.total) * 100 : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t("funnel.title")}</CardTitle>
        <CardDescription>{t("funnel.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 pt-4">
        {stages.map((stage, idx) => (
          <FunnelStage 
            key={idx}
            title={stage.title}
            count={stage.count}
            percentage={stage.percentage}
            share={stage.share}
            colorClass={stage.color}
            icon={stage.icon}
            isLast={idx === stages.length - 1}
          />
        ))}

        <div className="mt-8 pt-6 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Ban className="h-4 w-4 text-red-500" />
              <span>{t("funnel.cancelled")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {number(funnel.cancelled)}
              </span>
              <span className="text-muted-foreground">
                {t("funnel.share", { percent: percent(cancelledRate) })}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionFunnel;
