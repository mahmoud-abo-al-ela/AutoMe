"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { useAuditLabels } from "@/hooks/use-audit-labels";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Building2,
  ScrollText,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmptyState } from "@/components/common/EmptyState";
import {
  getActionCategory,
  actionIcons,
  actionColors,
} from "./audit-log-actions";
import AuditLogDetailsDialog from "./AuditLogDetailsDialog";
import { Prisma } from "@/lib/generated/prisma";

/** An audit log row as page.tsx selects it, with its user and organization. */
export type AuditLogRow = Prisma.AuditLogGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true; imageUrl: true } };
    organization: { select: { id: true; name: true; slug: true } };
  };
}>;

export type AuditLogsPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function AuditLogsTable({
  logs,
  pagination,
}: {
  logs: AuditLogRow[];
  pagination: AuditLogsPagination;
}) {
  const t = useTranslations("superAdmin");
  const labels = useAuditLabels();
  const { dateTime: fmtDateTime, relativeToNow, number } = useFormatters();
  const router = useRouter();
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    log: AuditLogRow | null;
  }>({
    open: false,
    log: null,
  });

  const handlePageChange = (newPage: number) => {
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
              <TableHead className="w-[180px]">{t("auditLogs.columns.timestamp")}</TableHead>
              <TableHead>{t("auditLogs.columns.user")}</TableHead>
              <TableHead>{t("auditLogs.columns.action")}</TableHead>
              <TableHead>{t("auditLogs.columns.entity")}</TableHead>
              <TableHead>{t("auditLogs.columns.organization")}</TableHead>
              <TableHead className="w-[80px]">{t("auditLogs.columns.details")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 p-0">
                  <EmptyState variant="inline" icon={ScrollText} title={t("auditLogs.empty")} />
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
                              {relativeToNow(new Date(log.createdAt))}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {fmtDateTime(new Date(log.createdAt))}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={log.user?.imageUrl ?? undefined}
                            alt={log.user?.name || log.userEmail || ""}
                          />
                          <AvatarFallback>
                            {(log.user?.name || log.userEmail)
                              ?.charAt(0)
                              ?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">
                            {log.user?.name || t("common.unknown")}
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
                        {labels.action(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">
                          {labels.entity(log.entityType)}
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
                          {t("common.platform")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailsDialog({ open: true, log })}
                        aria-label={t("auditLogs.viewDetails")}
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
            {t("auditLogs.pagination", {
              from: number((pagination.page - 1) * pagination.limit + 1),
              to: number(Math.min(pagination.page * pagination.limit, pagination.total)),
              total: number(pagination.total),
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              {t("common.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              {t("common.next")}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      <AuditLogDetailsDialog
        log={detailsDialog.log}
        open={detailsDialog.open}
        onOpenChange={(open) =>
          !open && setDetailsDialog({ open: false, log: null })
        }
      />
    </div>
  );
}
