import { useFormatters } from "@/hooks/use-formatters";
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
  const { date: fmtDate, relativeToNow } = useFormatters();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="audit" className="space-y-4">
          <TabsList>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
            <TabsTrigger value="testdrives">Test Drives</TabsTrigger>
          </TabsList>

          <TabsContent value="audit">
            {activity.length === 0 ? (
              <EmptyState variant="inline" icon={FileText} title="No activity recorded" />
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
                          {log.action}
                        </Badge>
                        <span className="text-sm font-medium">
                          {log.entityType}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.createdAt
                          ? relativeToNow(new Date(log.createdAt))
                          : "Unknown time"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="testdrives">
            {testDrives.length === 0 ? (
              <EmptyState variant="inline" icon={Car} title="No test drives booked" />
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
                          {td.car.year} {td.car.make} {td.car.model}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {fmtDate(new Date(td.date))}
                          {td.startTime ? ` · ${td.startTime}` : ""}
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
                      {td.status}
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
