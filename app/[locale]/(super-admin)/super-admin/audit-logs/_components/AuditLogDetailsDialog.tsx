"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { useAuditLabels } from "@/hooks/use-audit-labels";
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
  const t = useTranslations("superAdmin.auditLogs.details");
  const tCommon = useTranslations("superAdmin.common");
  const labels = useAuditLabels();
  const { dateTime: fmtDateTime } = useFormatters();
  const metadata = log?.metadata as AuditLogMetadata;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        {log && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("action")}
                </label>
                <p className="font-medium">{labels.action(log.action)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("entityType")}
                </label>
                <p className="font-medium">{labels.entity(log.entityType)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("entityId")}
                </label>
                <p className="font-mono text-sm">{log.entityId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("timestamp")}
                </label>
                <p className="text-sm">
                  {fmtDateTime(new Date(log.createdAt))}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("ipAddress")}
                </label>
                <p className="font-mono text-sm">
                  {metadata?.ipAddress || tCommon("notAvailable")}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("userAgent")}
                </label>
                <p className="text-sm truncate">
                  {metadata?.userAgent || tCommon("notAvailable")}
                </p>
              </div>
            </div>

            {log.metadata && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t("metadata")}
                </label>
                {/* JSON reads left to right whatever the page direction. */}
                <pre dir="ltr" className="mt-1 p-3 bg-muted rounded-lg overflow-auto text-xs text-start">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            )}

            {(log.oldValue || log.newValue) && (
              <div className="grid grid-cols-2 gap-4">
                {log.oldValue && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("before")}
                    </label>
                    <pre dir="ltr" className="mt-1 p-3 bg-muted rounded-lg overflow-auto text-xs text-start">
                      {JSON.stringify(log.oldValue, null, 2)}
                    </pre>
                  </div>
                )}
                {log.newValue && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      {t("after")}
                    </label>
                    <pre dir="ltr" className="mt-1 p-3 bg-muted rounded-lg overflow-auto text-xs text-start">
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
