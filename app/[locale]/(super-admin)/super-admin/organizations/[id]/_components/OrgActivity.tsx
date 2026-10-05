"use client";

// A client component: useFormatters and useAuditLabels live in client
// modules, and calling them from a server component throws.
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { useAuditLabels } from "@/hooks/use-audit-labels";
import { FileText, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/common/EmptyState";
import {
  getActionCategory,
  actionIcons,
  actionColors,
} from "../../../audit-logs/_components/audit-log-actions";
import type { Prisma } from "@/lib/generated/prisma";

/** An audit log row as page.tsx loads it for this organization. */
export type OrgActivityLog = Prisma.AuditLogGetPayload<{
  include: { user: { select: { id: true; name: true; imageUrl: true } } };
}>;

export default function OrgActivity({
  activity,
}: {
  activity: OrgActivityLog[];
}) {
  const t = useTranslations("superAdmin.organizations.details");
  const tCommon = useTranslations("superAdmin.common");
  const { relativeToNow } = useFormatters();
  const labels = useAuditLabels();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t("activity")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <EmptyState variant="inline" icon={FileText} title={t("activityEmpty")} />
        ) : (
          <div className="space-y-3">
            {activity.map((log) => {
              const actionCategory = getActionCategory(log.action);
              const ActionIcon = actionIcons[actionCategory] || Eye;

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={log.user?.imageUrl ?? undefined}
                      alt={log.user?.name ?? ""}
                    />
                    <AvatarFallback>
                      {log.user?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {log.user?.name || tCommon("unknown")}
                      </span>
                      <Badge
                        className={`flex items-center gap-1 text-xs ${
                          actionColors[actionCategory] || actionColors.VIEW
                        }`}
                      >
                        <ActionIcon className="h-3 w-3" />
                        {labels.action(log.action)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {labels.entity(log.entityType)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {relativeToNow(new Date(log.createdAt))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
