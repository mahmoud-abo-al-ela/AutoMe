"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/hooks/use-formatters";
import { Mail, Building2 } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import UserActions from "./UserActions";
import type { UserRole } from "@/lib/generated/prisma";
import type { SuperAdminUserRow } from "./UsersTable";

const roleVariant: Record<
  UserRole,
  React.ComponentProps<typeof Badge>["variant"]
> = {
  ADMIN: "destructive",
  USER: "secondary",
};

export default function UserRow({
  user,
  onChangeRole,
}: {
  user: SuperAdminUserRow;
  onChangeRole: (user: SuperAdminUserRow) => void;
}) {
  const t = useTranslations("superAdmin.users");
  const tRoles = useTranslations("org.settings.team.roles");
  const { relativeToNow, number } = useFormatters();

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.imageUrl ?? undefined} alt={user.name ?? ""} />
            <AvatarFallback>
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {user.email}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={roleVariant[user.role]}
          className="flex items-center gap-1 w-fit"
        >
          {t(`roles.${user.role}`)}
        </Badge>
      </TableCell>
      <TableCell>
        {user.memberships.length > 0 ? (
          <div className="flex flex-col gap-1">
            {user.memberships.slice(0, 2).map((m) => (
              <div key={m.id} className="text-sm flex items-center gap-1">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <span>{m.organization.name}</span>
                <Badge variant="outline" className="text-xs ms-1">
                  {tRoles(m.role)}
                </Badge>
              </div>
            ))}
            {user.memberships.length > 2 && (
              <span className="text-xs text-muted-foreground">
                {t("moreOrganizations", {
                  value: number(user.memberships.length - 2),
                })}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">
            {t("noOrganizations")}
          </span>
        )}
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <div>
            {t("testDrives", {
              count: user._count.testDrives,
              value: number(user._count.testDrives),
            })}
          </div>
          <div className="text-muted-foreground">
            {t("savedCars", {
              count: user._count.savedCars,
              value: number(user._count.savedCars),
            })}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {relativeToNow(new Date(user.createdAt))}
        </span>
      </TableCell>
      <TableCell>
        <UserActions user={user} onChangeRole={onChangeRole} />
      </TableCell>
    </TableRow>
  );
}
