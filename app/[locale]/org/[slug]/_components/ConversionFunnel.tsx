"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ArrowRightCircle, Ban } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ConversionFunnelData } from "./dashboard-types";
import { Panel } from "./Panel";

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
        <span className="text-body font-semibold">{title}</span>
      </div>
      <div className="text-end">
        <span className="text-h3 font-black tabular-nums">{count}</span>
        {share && (
          <span className="ms-2 hidden text-caption text-muted-foreground sm:inline-block">
            {share}
          </span>
        )}
      </div>
    </div>
    
    <Progress 
      value={percentage !== null ? percentage : 100} 
      className={`h-2.5 ${colorClass.track}`}
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
      color: { bg: "bg-foreground", text: "text-foreground", track: "bg-muted" }
    },
    {
      title: t("funnel.confirmed"),
      count: number(funnel.confirmed),
      percentage: funnel.confirmedRate,
      share: t("funnel.shareOfTotal", { percent: percent(funnel.confirmedRate) }),
      icon: CheckCircle2,
      color: { bg: "bg-primary", text: "text-primary", track: "bg-primary-soft" }
    },
    {
      title: t("funnel.completed"),
      count: number(funnel.completed),
      percentage: funnel.completedRate,
      share: t("funnel.shareOfConfirmed", { percent: percent(funnel.completedRate) }),
      icon: CheckCircle2,
      color: { bg: "bg-positive", text: "text-positive", track: "bg-positive-soft" }
    }
  ];

  const cancelledRate = funnel.total > 0 ? (funnel.cancelled / funnel.total) * 100 : 0;

  return (
    <Panel title={t("funnel.title")} description={t("funnel.description")} className="h-full" bodyClassName="gap-8">
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

        <div className="border-t border-border pt-5">
          <div className="flex items-center justify-between text-caption">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Ban aria-hidden className="size-4 text-destructive" />
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
    </Panel>
  );
};

export default ConversionFunnel;
