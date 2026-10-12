"use client";

import { useTranslations } from "next-intl";
import {
  Eye,
  MoreHorizontal,
  ShieldCheck,
  ShieldOff,
  UserCog,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { UserRow } from "@/lib/services/super-admin/users";
import { useUserDisplay } from "./use-user-display";

const BASE = "/super-admin/users";

/** One person's menu in the users list: open them, sign in as them, or change their admin access. */
export function UserRowMenu({
  row,
  currentAdminId,
  onImpersonate,
  onChangeRole,
}: {
  row: UserRow;
  currentAdminId: string;
  onImpersonate: (row: UserRow) => void;
  onChangeRole: (row: UserRow) => void;
}) {
  const t = useTranslations("superAdmin.users");
  const display = useUserDisplay();
  const team = row.memberships[0]?.organization;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("actionsFor", { name: display.name(row) })}
        className="flex size-10 items-center justify-center rounded-control text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MoreHorizontal aria-hidden className="size-[18px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-control p-1.5">
        <DropdownMenuItem asChild className="h-10 gap-2.5">
          <Link href={`${BASE}/${row.id}`}>
            <Eye aria-hidden className="size-4" />
            {t("actions.open")}
          </Link>
        </DropdownMenuItem>
        {team && (
          <DropdownMenuItem className="h-10 gap-2.5" onSelect={() => onImpersonate(row)}>
            <UserCog aria-hidden className="size-4" />
            {t("actions.impersonate")}
          </DropdownMenuItem>
        )}
        {row.id !== currentAdminId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className={cn("h-10 gap-2.5", row.role === "ADMIN" && "text-destructive focus:text-destructive")} onSelect={() => onChangeRole(row)}>
              {row.role === "ADMIN" ? <ShieldOff aria-hidden className="size-4" /> : <ShieldCheck aria-hidden className="size-4" />}
              {row.role === "ADMIN" ? t("actions.removeAdmin") : t("actions.makeAdmin")}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
