"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MoreHorizontal, UserCog, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SuperAdminUserRow } from "./UsersTable";

export default function UserActions({
  user,
  onChangeRole,
}: {
  user: SuperAdminUserRow;
  onChangeRole: (user: SuperAdminUserRow) => void;
}) {
  const t = useTranslations("superAdmin.users.actions");
  const tCommon = useTranslations("superAdmin.common");
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("label")}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("label")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onChangeRole(user)}>
          <UserCog className="h-4 w-4 me-2" />
          {t("changeRole")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push(`/super-admin/users/${user.id}`)}
        >
          <User className="h-4 w-4 me-2" />
          {tCommon("viewDetails")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
