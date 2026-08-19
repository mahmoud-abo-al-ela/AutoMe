"use client";
import { useFormatters } from "@/hooks/use-formatters";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { AuditLogRow } from "./AuditLogsTable";

/**
 * What createAuditLog writes into the metadata Json column alongside whatever
 * the caller passed. Prisma types the column as JsonValue, so the shape is
 * asserted here rather than inferred.
 */
type AuditLogMetadata = {
  ipAddress?: string;
  userAgent?: string;
  impersonationSessionId?: string;
} | null;

// Read-only detail view for a single audit log entry.
export default function AuditLogDetailsDialog({
  log,
  open,
  onOpenChange,
}: {
  log: AuditLogRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { dateTime: fmtDateTime } = useFormatters();
  const metadata = log?.metadata as AuditLogMetadata;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
        </DialogHeader>
        {log && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Action
                </label>
                <p className="font-medium">{log.action}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Entity Type
                </label>
                <p className="font-medium">{log.entityType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Entity ID
                </label>
                <p className="font-mono text-sm">{log.entityId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Timestamp
                </label>
                <p className="text-sm">
                  {fmtDateTime(new Date(log.createdAt))}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  IP Address
                </label>
                <p className="font-mono text-sm">{metadata?.ipAddress || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  User Agent
                </label>
                <p className="text-sm truncate">{metadata?.userAgent || "N/A"}</p>
              </div>
            </div>

            {log.metadata && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Metadata
                </label>
                <pre className="mt-1 p-3 bg-muted rounded-lg overflow-auto text-xs">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            )}

            {(log.oldValue || log.newValue) && (
              <div className="grid grid-cols-2 gap-4">
                {log.oldValue && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Before
                    </label>
                    <pre className="mt-1 p-3 bg-muted rounded-lg overflow-auto text-xs">
                      {JSON.stringify(log.oldValue, null, 2)}
                    </pre>
                  </div>
                )}
                {log.newValue && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      After
                    </label>
                    <pre className="mt-1 p-3 bg-muted rounded-lg overflow-auto text-xs">
                      {JSON.stringify(log.newValue, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
