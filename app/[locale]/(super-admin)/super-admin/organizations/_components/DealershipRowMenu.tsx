"use client";

import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, Eye, MoreHorizontal, Pause, Play, Trash2, UserCog } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { storefrontUrl } from "@/lib/utils/tenant-host";
import type { DealershipRow } from "@/lib/services/super-admin/dealerships";

/**
 * A dealership's actions, behind "⋯" at the end of its row: open it, start a
 * support session, see its storefront, suspend or reactivate it, and — kept
 * apart and in red — delete it, which asks first.
 */
export function DealershipRowMenu({
  row,
  busy,
  onImpersonate,
  onToggleStatus,
  onDelete,
}: {
  row: DealershipRow;
  busy: boolean;
  onImpersonate: (row: DealershipRow) => void;
  onToggleStatus: (row: DealershipRow) => void;
  onDelete: (row: DealershipRow) => void;
}) {
  const t = useTranslations("superAdmin.organizations");
  const locale = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("actionsFor", { name: row.name })}
        className="flex size-10 items-center justify-center rounded-control text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MoreHorizontal aria-hidden className="size-[18px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-control p-1.5">
        <DropdownMenuItem asChild className="h-10 gap-2.5">
          <Link href={`/super-admin/organizations/${row.id}`}>
            <Eye aria-hidden className="size-4" />
            {t("actions.open")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="h-10 gap-2.5" onSelect={() => onImpersonate(row)}>
          <UserCog aria-hidden className="size-4" />
          {t("actions.impersonate")}
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-10 gap-2.5">
          <a href={storefrontUrl(row.slug, locale)} target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden className="size-4" />
            {t("actions.publicPage")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="h-10 gap-2.5" disabled={busy} onSelect={() => onToggleStatus(row)}>
          {row.isActive ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
          {row.isActive ? t("actions.suspend") : t("actions.activate")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="h-10 gap-2.5 text-destructive focus:text-destructive" onSelect={() => onDelete(row)}>
          <Trash2 aria-hidden className="size-4" />
          {t("actions.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
