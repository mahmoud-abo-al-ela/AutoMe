"use client";

import { useTranslations } from "next-intl";
import { useSearchParams, useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AuditLogTableRow from "./audit-table/AuditLogTableRow";
import AuditLogDetailsDialog from "./audit-table/AuditLogDetailsDialog";
import AuditLogsPagination from "./audit-table/AuditLogsPagination";
import { EmptyState } from "@/components/common/EmptyState";
import { ScrollText } from "lucide-react";
import type {
  AuditLogWithUser,
  AuditLogsPageInfo,
} from "../_lib/audit-types";

interface AuditLogsTableProps {
  logs: AuditLogWithUser[];
  pagination: AuditLogsPageInfo;
}

export default function AuditLogsTable({
  logs,
  pagination,
}: AuditLogsTableProps) {
  const t = useTranslations("org.auditLogs");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { slug } = useParams();
  const [selectedLog, setSelectedLog] = useState<AuditLogWithUser | null>(null);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/org/${slug}/audit-logs?${params.toString()}`);
  };

  if (!logs || logs.length === 0) {
    return (
      <EmptyState
        variant="inline"
        icon={ScrollText}
        title={t("empty.title")}
        className="border rounded-lg"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">{t("table.timestamp")}</TableHead>
              <TableHead>{t("table.action")}</TableHead>
              <TableHead>{t("table.entity")}</TableHead>
              <TableHead>{t("table.user")}</TableHead>
              <TableHead className="w-[80px]">{t("table.details")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <AuditLogTableRow
                key={log.id}
                log={log}
                onView={(log) => setSelectedLog(log)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <AuditLogsPagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        totalEntries={pagination.total}
        limit={pagination.limit}
        onPageChange={handlePageChange}
      />

      <AuditLogDetailsDialog
        log={selectedLog}
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      />
    </div>
  );
}
