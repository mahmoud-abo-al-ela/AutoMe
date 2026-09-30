import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFormatters } from "@/hooks/use-formatters";
import { useAuditLabels } from "../../_lib/use-audit-labels";
import {
  Activity,
  Code,
  Globe,
  Hash,
  User,
  Shield,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import type { AuditLogWithUser } from "../../_lib/audit-types";

const DetailItem = ({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span className="text-xs font-medium uppercase tracking-wider">
        {label}
      </span>
    </div>
    <p
      className={`text-sm ${
        mono ? "font-mono bg-muted/50 px-2 py-0.5 rounded w-fit" : ""
      }`}
    >
      {value}
    </p>
  </div>
);

const JsonViewer = ({ data, title }: { data: unknown; title: string }) => {
  if (!data) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Code className="h-3.5 w-3.5" />
        <span className="text-xs font-medium uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="relative rounded-md border bg-muted/30 p-4">
        {/* The payload is machine data, so it reads left-to-right whichever
            way the page runs. */}
        <pre dir="ltr" className="text-xs font-mono overflow-x-auto whitespace-pre-wrap text-start">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

interface AuditLogDetailsDialogProps {
  log: AuditLogWithUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuditLogDetailsDialog({
  log,
  open,
  onOpenChange,
}: AuditLogDetailsDialogProps) {
  const t = useTranslations("org.auditLogs");
  const { dateTime } = useFormatters();
  const label = useAuditLabels();

  if (!log) return null;

  // `metadata` is a Prisma Json column, so it can be any JSON value; only a
  // plain object carries the fields this dialog reads.
  const metadata =
    log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
      ? (log.metadata as Record<string, unknown>)
      : null;
  const ipAddress =
    typeof metadata?.ipAddress === "string" ? metadata.ipAddress : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            {t("details.title")}
          </DialogTitle>
          <DialogDescription>
            {t("details.recordedOn", { date: dateTime(log.createdAt) })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Primary Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/20 rounded-lg border">
            <DetailItem
              icon={Activity}
              label={t("details.action")}
              value={label.action(log.action)}
            />
            <DetailItem
              icon={Hash}
              label={t("details.entityType")}
              value={label.entity(log.entityType)}
            />
            <DetailItem
              icon={Code}
              label={t("details.entityId")}
              value={log.entityId}
              mono
            />
            {ipAddress && (
              <DetailItem
                icon={Globe}
                label={t("details.ipAddress")}
                value={ipAddress}
                mono
              />
            )}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium">{t("details.executedBy")}</h4>
              <p className="text-sm text-foreground">
                {log.user?.name || log.userEmail || t("unknownUser")}
              </p>
              <p className="text-xs text-muted-foreground">{log.userEmail}</p>
            </div>
            {log.impersonatedBy && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 rounded-full text-xs font-medium">
                <Shield className="h-3 w-3" />
                {t("details.impersonatedAction")}
              </div>
            )}
          </div>

          {/* Changes */}
          {(log.oldValue || log.newValue) && (
            <div className="grid md:grid-cols-2 gap-4">
              <JsonViewer data={log.oldValue} title={t("details.previousState")} />
              <JsonViewer data={log.newValue} title={t("details.newState")} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
