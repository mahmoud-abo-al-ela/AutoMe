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
import type { LucideIcon } from "lucide-react";

export default function UsageBar({
  icon: Icon,
  label,
  current,
  limit,
}: {
  icon: LucideIcon;
  label: string;
  current: number;
  /** -1 means unlimited. */
  limit: number;
}) {
  const percent = getUsagePercent(current, limit);
  const isUnlimited = limit === -1;
  const colorClass = getUsageColor(percent);
  const textColorClass = getUsageTextColor(percent);
  const isNearLimit = !isUnlimited && percent > 80;
  const remaining = isUnlimited ? null : Math.max(0, limit - current);

  const tooltipContent = isUnlimited
    ? `${current} ${label.toLowerCase()} used — no limit`
    : `${current} of ${limit} used (${Math.round(percent)}%) — ${remaining} remaining`;

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
                {current}
                {!isUnlimited ? ` / ${limit}` : ""}
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
                Unlimited
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
          Running low?{" "}
          <a href="#plans" className="underline hover:no-underline font-medium">
            Upgrade for more
          </a>
        </p>
      )}
    </div>
  );
}
