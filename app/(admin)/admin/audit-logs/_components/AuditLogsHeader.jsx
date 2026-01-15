"use client";

import { ScrollText, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AuditLogsHeader({ retentionInfo }) {
  const getRetentionText = () => {
    if (!retentionInfo) return "90 days (Starter Plan)";
    
    const days = retentionInfo.auditLogRetentionDays;
    if (days === null) return "Unlimited (Enterprise Plan)";
    if (days === 365) return "1 year (Pro Plan)";
    return `${days} days (Starter Plan)`;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <ScrollText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground text-sm">
            Track all actions and changes in your organization
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Badge variant="outline" className="font-normal">
          Retention: {getRetentionText()}
        </Badge>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Audit logs are automatically deleted after the retention period.
                Upgrade your plan for longer retention.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
