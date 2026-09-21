"use client";

import { useTranslations } from "next-intl";
import { ScrollText, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFormatters } from "@/hooks/use-formatters";
import { planKeyFor } from "@/components/Pricing/pricing-plans";
import type { Plan } from "@/lib/generated/prisma";

interface AuditLogsHeaderProps {
  /** The organization's plan, or null/undefined when it has no subscription. */
  retentionInfo?: Pick<Plan, "auditLogRetentionDays" | "name" | "type"> | null;
}

/** What an organization with no subscription gets. */
const FREE_RETENTION_DAYS = 90;

export default function AuditLogsHeader({
  retentionInfo,
}: AuditLogsHeaderProps) {
  const t = useTranslations("org.auditLogs");
  const tPlans = useTranslations("plans");
  const { number } = useFormatters();

  const duration = () => {
    const days = retentionInfo
      ? retentionInfo.auditLogRetentionDays
      : FREE_RETENTION_DAYS;

    if (days === null) return t("retention.unlimited");
    // Whole years read as years; anything else stays in days.
    if (days % 365 === 0) {
      const years = days / 365;
      return t("retention.years", { count: years, value: number(years) });
    }
    return t("retention.days", { count: days, value: number(days) });
  };

  // The plan name used to be guessed from the retention period — 365 days
  // meant "Pro Plan" — which was both a fiction and English by construction.
  // The plan itself is already on the page, so read its name from the shared
  // plan copy and fall back to the untranslated DB name.
  const planName = () => {
    const key = planKeyFor(retentionInfo?.type);
    if (key) return tPlans(`plans.${key}.name`);
    return retentionInfo?.name ?? tPlans("plans.starter.name");
  };

  return (
    <div className="flex flex-col gap-4 border-b pb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <ScrollText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-normal gap-1">
            {t("retention.label", {
              value: t("retention.withPlan", {
                duration: duration(),
                plan: planName(),
              }),
            })}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">{t("retention.tooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Badge>
        </div>
      </div>
    </div>
  );
}
