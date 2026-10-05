"use client";

// A client component: useFormatters and useAuditLabels live in client
// modules, and calling them from a server component throws.
import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { useAuditLabels } from "@/hooks/use-audit-labels";
import { FileText, Calendar, Car } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/EmptyState";
import type { AuditLog } from "@/lib/generated/prisma";
import type { SuperAdminUserDetail } from "./UserDetailsHeader";

export default function UserActivity({
  activity,
  testDrives,
}: {
  activity: AuditLog[];
  testDrives: SuperAdminUserDetail["testDrives"];
}) {
  const t = useTranslations("superAdmin.users.details");
  const tStatus = useTranslations("testDrive.status");
  const { date: fmtDate, relativeToNow, clockTime, number } = useFormatters();
  const labels = useAuditLabels();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("activity")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="audit" className="space-y-4">
          <TabsList>
            <TabsTrigger value="audit">{t("tabs.audit")}</TabsTrigger>
            <TabsTrigger value="testdrives">{t("tabs.testDrives")}</TabsTrigger>
          </TabsList>

          <TabsContent value="audit">
            {activity.length === 0 ? (
              <EmptyState variant="inline" icon={FileText} title={t("activityEmpty")} />
            ) : (
              <div className="space-y-3">
                {activity.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <div className="p-2 rounded-lg bg-muted">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {labels.action(log.action)}
                        </Badge>
                        <span className="text-sm font-medium">
                          {labels.entity(log.entityType)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.createdAt
                          ? relativeToNow(new Date(log.createdAt))
                          : t("unknownTime")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="testdrives">
            {testDrives.length === 0 ? (
              <EmptyState variant="inline" icon={Car} title={t("testDrivesEmpty")} />
            ) : (
              <div className="space-y-3">
                {testDrives.map((td) => (
                  <div
                    key={td.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Car className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {number(td.car.year, { useGrouping: false })} {td.car.make}{" "}
                          {td.car.model}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {fmtDate(new Date(td.date))}
                          {td.startTime ? ` · ${clockTime(td.startTime)}` : ""}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        td.status === "COMPLETED"
                          ? "default"
                          : td.status === "CANCELLED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {tStatus(td.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
