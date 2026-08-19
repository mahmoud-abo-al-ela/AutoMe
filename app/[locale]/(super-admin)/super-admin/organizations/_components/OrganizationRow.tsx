"use client";

import { formatDistanceToNow } from "date-fns";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Car, Users, Calendar, ExternalLink } from "lucide-react";
import OrganizationActions from "./OrganizationActions";
import type { PlanType } from "@/lib/generated/prisma";
import type { OrganizationRowData } from "./OrganizationsTable";

export default function OrganizationRow({
  org,
  onToggleStatus,
  onImpersonate,
  onDelete,
  actionLoading,
  isPending,
}: {
  org: OrganizationRowData;
  onToggleStatus: (org: OrganizationRowData) => void;
  onImpersonate: (org: OrganizationRowData) => void;
  onDelete: (org: OrganizationRowData) => void;
  actionLoading: string | null;
  isPending: boolean;
}) {
  const getPlanBadgeColor = (planType: PlanType | undefined) => {
    switch (planType) {
      case "ENTERPRISE":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "PRO":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "STARTER":
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {org.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{org.name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{org.slug}.localhost</span>
              <ExternalLink className="h-3 w-3" />
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className={getPlanBadgeColor(org.subscription?.plan?.type)}
        >
          {org.subscription?.plan?.name || "No Plan"}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <Car className="h-4 w-4 text-muted-foreground" />
          <span>{org._count.cars}</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{org._count.memberships}</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{org._count.testDrives}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={org.isActive ? "default" : "secondary"}>
          {org.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatDistanceToNow(new Date(org.createdAt), {
          addSuffix: true,
        })}
      </TableCell>
      <TableCell className="text-end">
        <OrganizationActions
          org={org}
          onToggleStatus={onToggleStatus}
          onImpersonate={onImpersonate}
          onDelete={onDelete}
          actionLoading={actionLoading}
          isPending={isPending}
        />
      </TableCell>
    </TableRow>
  );
}
