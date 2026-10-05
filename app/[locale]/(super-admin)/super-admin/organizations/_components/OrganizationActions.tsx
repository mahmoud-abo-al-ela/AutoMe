"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  UserCog,
  Pause,
  Play,
  Trash2,
  Loader2,
} from "lucide-react";
import type { OrganizationRowData } from "./OrganizationsTable";

export default function OrganizationActions({
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
  /** `status-<id>` / `delete-<id>` while that row's action is in flight. */
  actionLoading: string | null;
  isPending: boolean;
}) {
  const t = useTranslations("superAdmin.organizations.actions");
  const tCommon = useTranslations("superAdmin.common");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{tCommon("actions")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/super-admin/organizations/${org.id}`}>
            <Eye className="h-4 w-4 me-2" />
            {tCommon("viewDetails")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onImpersonate(org)}>
          <UserCog className="h-4 w-4 me-2" />
          {t("impersonate")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onToggleStatus(org)}
          disabled={actionLoading === `status-${org.id}` || isPending}
        >
          {actionLoading === `status-${org.id}` ? (
            <>
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
              {org.isActive ? t("suspending") : t("activating")}
            </>
          ) : org.isActive ? (
            <>
              <Pause className="h-4 w-4 me-2" />
              {t("suspend")}
            </>
          ) : (
            <>
              <Play className="h-4 w-4 me-2" />
              {t("activate")}
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(org)}
        >
          <Trash2 className="h-4 w-4 me-2" />
          {tCommon("delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
