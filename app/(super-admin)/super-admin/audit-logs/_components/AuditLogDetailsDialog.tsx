"use client";

import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { AuditLogRow } from "./AuditLogsTable";

/**
 * BUG (flagged, not fixed in this conversion): this dialog reads ipAddress,
 * userAgent and changes, and the AuditLog model has none of them. The schema
 * keeps IP and user agent inside the metadata Json blob, and the before/after
 * pair in oldValue/newValue. Every read is guarded (|| "N/A", &&), so the
 * result is dead UI rather than a crash: the IP Address and User Agent rows
 * always print "N/A" and the Changes block never renders.
 *
 * Typed as always-undefined so the dead reads compile unchanged and the defect
 * stays legible instead of being hidden behind a cast.
 */
type AuditLogRowWithMissingFields = AuditLogRow & {
  ipAddress?: undefined;
  userAgent?: undefined;
  changes?: undefined;
};

// Read-only detail view for a single audit log entry.
export default function AuditLogDetailsDialog({
  log,
  open,
  onOpenChange,
}: {
  log: AuditLogRowWithMissingFields | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
                  {format(new Date(log.createdAt), "PPpp")}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  IP Address
                </label>
                <p className="font-mono text-sm">{log.ipAddress || "N/A"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  User Agent
                </label>
                <p className="text-sm truncate">{log.userAgent || "N/A"}</p>
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

            {log.changes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Changes
                </label>
                <pre className="mt-1 p-3 bg-muted rounded-lg overflow-auto text-xs">
                  {JSON.stringify(log.changes, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
