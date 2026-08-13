"use client";

import { ScrollText, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Plan } from "@/lib/generated/prisma";

interface AuditLogsHeaderProps {
  /** The organization's plan, or null/undefined when it has no subscription. */
  retentionInfo?: Pick<Plan, "auditLogRetentionDays"> | null;
}

export default function AuditLogsHeader({
  retentionInfo,
}: AuditLogsHeaderProps) {
  const getRetentionText = () => {
    if (!retentionInfo) return "90 days (Starter Plan)";

    const days = retentionInfo.auditLogRetentionDays;
    if (days === null) return "Unlimited (Enterprise Plan)";
    if (days === 365) return "1 year (Pro Plan)";
    return `${days} days (Starter Plan)`;
  };

  return (
    <div className="flex flex-col gap-4 border-b pb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <ScrollText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground text-sm">
              Track all actions and changes in your organization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-normal gap-1">
            Retention: {getRetentionText()}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    Audit logs are automatically deleted after the retention period.
                    Upgrade your plan for longer retention.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Badge>
        </div>
      </div>
    </div>
  );
}
