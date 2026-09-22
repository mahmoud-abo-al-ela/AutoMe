import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Settings } from "lucide-react";
import { ACTION_COLORS, ENTITY_ICONS } from "./constants";
import { formatActionLabel, formatDate } from "./utils";
import type { AuditLogWithUser } from "../../_lib/audit-types";

interface AuditLogTableRowProps {
  log: AuditLogWithUser;
  onView: (log: AuditLogWithUser) => void;
}

export default function AuditLogTableRow({
  log,
  onView,
}: AuditLogTableRowProps) {
  const EntityIcon = ENTITY_ICONS[log.entityType] || Settings;

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <TableRow className="group hover:bg-muted/50 transition-colors">
      <TableCell className="text-muted-foreground text-sm font-mono whitespace-nowrap">
        {formatDate(log.createdAt)}
      </TableCell>
      <TableCell>
        <Badge
          className={`${
            ACTION_COLORS[log.action] || "bg-gray-100 dark:bg-gray-800"
          } font-medium border-0`}
        >
          {formatActionLabel(log.action)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-muted rounded-md">
            <EntityIcon className="h-4 w-4 text-foreground" />
          </div>
          <span className="text-sm font-medium">{log.entityType}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={log.user?.imageUrl ?? undefined}
              alt={log.user?.name ?? undefined}
            />
            <AvatarFallback>
              {getInitials(log.user?.name || "U")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-none">
              {log.user?.name || "Unknown User"}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {log.userEmail}
            </span>
            {log.impersonatedBy && (
              <Badge
                variant="outline"
                className="text-micro px-1 py-0 h-4 mt-1 w-fit border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
              >
                Impersonated
              </Badge>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onView(log)}
          aria-label="View details"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
