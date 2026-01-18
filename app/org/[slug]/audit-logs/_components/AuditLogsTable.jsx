"use client";

import { useRouter, useSearchParams, useParams } from "next/navigation";
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

export default function AuditLogsTable({ logs, pagination }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { slug } = useParams();
  const [selectedLog, setSelectedLog] = useState(null);

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/org/${slug}/audit-logs?${params.toString()}`);
  };

  if (!logs || logs.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">No audit logs found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
