"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  Building2,
  User,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper to get action category from detailed action name
const getActionCategory = (action) => {
  if (action.includes("CREATED") || action.includes("INVITED")) return "CREATE";
  if (
    action.includes("UPDATED") ||
    action.includes("CHANGED") ||
    action.includes("TOGGLED") ||
    action.includes("UPGRADED") ||
    action.includes("DOWNGRADED") ||
    action.includes("RENEWED") ||
    action.includes("CONFIRMED") ||
    action.includes("COMPLETED") ||
    action.includes("ACTIVATED") ||
    action.includes("ACCEPTED")
  )
    return "UPDATE";
  if (
    action.includes("DELETED") ||
    action.includes("REMOVED") ||
    action.includes("CANCELED") ||
    action.includes("SUSPENDED")
  )
    return "DELETE";
  if (action.includes("STARTED") || action.includes("SENT")) return "LOGIN";
  if (action.includes("ENDED")) return "LOGOUT";
  return "VIEW";
};

const actionIcons = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  VIEW: Eye,
  LOGIN: LogIn,
  LOGOUT: LogOut,
};

const actionColors = {
  CREATE:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  VIEW: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  LOGIN:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  LOGOUT:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

export default function AuditLogsTable({ logs, pagination }) {
  const router = useRouter();
  const [detailsDialog, setDetailsDialog] = useState({
    open: false,
    log: null,
  });

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`/super-admin/audit-logs?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead className="w-[80px]">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const actionCategory = getActionCategory(log.action);
                const ActionIcon = actionIcons[actionCategory] || Eye;

                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-sm">
                              {formatDistanceToNow(new Date(log.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {format(new Date(log.createdAt), "PPpp")}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={log.user?.imageUrl}
                            alt={log.user?.name || log.userEmail}
                          />
                          <AvatarFallback>
                            {(log.user?.name || log.userEmail)
                              ?.charAt(0)
                              ?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">
                            {log.user?.name || "Unknown"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {log.userEmail}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`flex items-center gap-1 w-fit ${
                          actionColors[actionCategory] || actionColors.VIEW
                        }`}
                      >
                        <ActionIcon className="h-3 w-3" />
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">
                          {log.entityType}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {log.entityId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.organization ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {log.organization.name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Platform
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailsDialog({ open: true, log })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} logs
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog
        open={detailsDialog.open}
        onOpenChange={(open) =>
          !open && setDetailsDialog({ open: false, log: null })
        }
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {detailsDialog.log && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Action
                  </label>
                  <p className="font-medium">{detailsDialog.log.action}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Entity Type
                  </label>
                  <p className="font-medium">{detailsDialog.log.entityType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Entity ID
                  </label>
                  <p className="font-mono text-sm">
                    {detailsDialog.log.entityId}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Timestamp
                  </label>
                  <p className="text-sm">
                    {format(new Date(detailsDialog.log.createdAt), "PPpp")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    IP Address
                  </label>
                  <p className="font-mono text-sm">
                    {detailsDialog.log.ipAddress || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    User Agent
                  </label>
                  <p className="text-sm truncate">
                    {detailsDialog.log.userAgent || "N/A"}
                  </p>
                </div>
              </div>

              {detailsDialog.log.metadata && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Metadata
                  </label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg overflow-auto text-xs">
                    {JSON.stringify(detailsDialog.log.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {detailsDialog.log.changes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Changes
                  </label>
                  <pre className="mt-1 p-3 bg-muted rounded-lg overflow-auto text-xs">
                    {JSON.stringify(detailsDialog.log.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
