"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  Car,
  Calendar,
  Users,
  Building2,
  MessageSquare,
  CreditCard,
  Settings,
  UserCog,
} from "lucide-react";
import { useState } from "react";

const actionColors = {
  CAR_CREATED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CAR_UPDATED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  CAR_DELETED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  CAR_STATUS_CHANGED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  TEST_DRIVE_CREATED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  TEST_DRIVE_CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  TEST_DRIVE_CANCELED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  MEMBER_INVITED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  MEMBER_ROLE_CHANGED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  MEMBER_REMOVED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  SETTINGS_UPDATED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  ORG_UPDATED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SUBSCRIPTION_CREATED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  SUBSCRIPTION_UPGRADED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const entityIcons = {
  CAR: Car,
  TEST_DRIVE: Calendar,
  MEMBERSHIP: Users,
  ORGANIZATION: Building2,
  CONVERSATION: MessageSquare,
  SUBSCRIPTION: CreditCard,
  SETTINGS: Settings,
  USER: UserCog,
};

const formatActionLabel = (action) => {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function AuditLogsTable({ logs, pagination }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedLog, setSelectedLog] = useState(null);

  const goToPage = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/admin/audit-logs?${params.toString()}`);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (logs.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No audit logs found</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="w-[80px]">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => {
              const EntityIcon = entityIcons[log.entityType] || Settings;
              
              return (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge className={actionColors[log.action] || "bg-gray-100"}>
                      {formatActionLabel(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <EntityIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{log.entityType}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {log.user?.name || "Unknown User"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {log.userEmail}
                      </span>
                      {log.impersonatedBy && (
                        <Badge variant="outline" className="text-xs mt-1 w-fit">
                          Impersonated
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Audit Log Details</DialogTitle>
                          <DialogDescription>
                            {formatActionLabel(log.action)} on {formatDate(log.createdAt)}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-muted-foreground">Action</span>
                              <p>{formatActionLabel(log.action)}</p>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Entity Type</span>
                              <p>{log.entityType}</p>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Entity ID</span>
                              <p className="font-mono text-xs">{log.entityId}</p>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">User</span>
                              <p>{log.user?.name || log.userEmail}</p>
                            </div>
                          </div>

                          {log.metadata?.ipAddress && (
                            <div className="text-sm">
                              <span className="font-medium text-muted-foreground">IP Address</span>
                              <p className="font-mono text-xs">{log.metadata.ipAddress}</p>
                            </div>
                          )}

                          {log.oldValue && (
                            <div>
                              <span className="font-medium text-muted-foreground text-sm">Previous Value</span>
                              <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                                {JSON.stringify(log.oldValue, null, 2)}
                              </pre>
                            </div>
                          )}

                          {log.newValue && (
                            <div>
                              <span className="font-medium text-muted-foreground text-sm">New Value</span>
                              <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                                {JSON.stringify(log.newValue, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} entries
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
