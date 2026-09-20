"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getUsagePercent,
  getUsageColor,
  getUsageTextColor,
} from "./_lib/current-plan-utils";
import { useFormatters } from "@/hooks/use-formatters";
import type { LucideIcon } from "lucide-react";

export default function UsageBar({
  icon: Icon,
  label,
  current,
  limit,
}: {
  icon: LucideIcon;
  /** Already translated by the caller. */
  label: string;
  current: number;
  /** -1 means unlimited. */
  limit: number;
}) {
  const t = useTranslations("org.billing.usage");
  const { number } = useFormatters();

  const percent = getUsagePercent(current, limit);
  const isUnlimited = limit === -1;
  const colorClass = getUsageColor(percent);
  const textColorClass = getUsageTextColor(percent);
  const isNearLimit = !isUnlimited && percent > 80;
  const remaining = isUnlimited ? null : Math.max(0, limit - current);

  // Counts and the percentage are formatted before they enter the message —
  // a raw numeric ICU argument renders Western digits in Arabic. The label
  // was also lower-cased for the tooltip, which is meaningless outside
  // English and is dropped.
  const tooltipContent = isUnlimited
    ? t("tooltipUnlimited", { current: number(current), label })
    : t("tooltip", {
        current: number(current),
        limit: number(limit),
        percent: number(percent / 100, {
          style: "percent",
          maximumFractionDigits: 0,
        }),
        remaining: number(remaining ?? 0),
      });

  return (
    <div className="space-y-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-default">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </div>
              <span className={`font-medium ${textColorClass}`}>
                {number(current)}
                {!isUnlimited ? ` / ${number(limit)}` : ""}
              </span>
            </div>
            {!isUnlimited ? (
              <Progress
                value={percent}
                className="h-2 mt-2"
                indicatorClassName={colorClass}
              />
            ) : (
              <Badge variant="outline" className="text-xs mt-2">
                {t("unlimited")}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
      {isNearLimit && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {t("runningLow")}{" "}
          <a href="#plans" className="underline hover:no-underline font-medium">
            {t("upgradeLink")}
          </a>
        </p>
      )}
    </div>
  );
}
