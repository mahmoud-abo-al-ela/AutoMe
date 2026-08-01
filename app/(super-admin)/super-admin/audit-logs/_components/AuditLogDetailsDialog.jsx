"use client";

import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Read-only detail view for a single audit log entry.
export default function AuditLogDetailsDialog({ log, open, onOpenChange }) {
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
